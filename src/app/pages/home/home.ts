import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import {
  FormField,
  email,
  form,
  maxLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { Enquiry } from '../../services/enquiry';
import { Seo, homeSeo } from '../../services/seo';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme: 'light';
          callback: (token: string) => void;
          'expired-callback': () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

@Component({
  selector: 'app-home',
  imports: [FormField, RouterLink],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements AfterViewInit, OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly enquiryService = inject(Enquiry);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly seo = inject(Seo);

  protected readonly menuOpen = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitState = signal<'idle' | 'success' | 'error'>('idle');
  protected readonly captchaToken = signal('');
  protected readonly captchaConfigured = signal(false);
  private captchaWidgetId: string | undefined;

  protected readonly enquiryModel = signal({
    name: '',
    email: '',
    phone: '',
    message: '',
    privacyAccepted: false,
    website: '',
  });

  protected readonly enquiryForm = form(this.enquiryModel, (schema) => {
    required(schema.name, { message: 'Please enter your name.' });
    maxLength(schema.name, 100, { message: 'Please keep your name under 100 characters.' });
    required(schema.email, { message: 'Please enter your email address.' });
    email(schema.email, { message: 'Please enter a valid email address.' });
    maxLength(schema.email, 254, { message: 'Please enter a valid email address.' });
    maxLength(schema.phone, 40, { message: 'Please keep your phone number under 40 characters.' });
    required(schema.message, { message: 'Please tell us how we can help.' });
    maxLength(schema.message, 1_500, {
      message: 'Please keep your message under 1,500 characters.',
    });
    validate(schema.privacyAccepted, ({ value }) =>
      value()
        ? undefined
        : { kind: 'privacy', message: 'Please confirm you have read the privacy notice.' },
    );
  });

  ngOnInit(): void {
    this.seo.apply(homeSeo);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (window.turnstile) {
      this.renderCaptcha();
      return;
    }

    const script = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile/"]',
    );
    if (!script) return;

    const renderCaptcha = () => this.renderCaptcha();
    script.addEventListener('load', renderCaptcha, { once: true });
    this.destroyRef.onDestroy(() => script.removeEventListener('load', renderCaptcha));
  }

  private renderCaptcha(): void {
    if (this.captchaWidgetId || !window.turnstile) return;

    const siteKey = document
      .querySelector<HTMLMetaElement>('meta[name="turnstile-site-key"]')
      ?.content.trim();
    const mount = document.getElementById('turnstile-widget');
    if (!siteKey || !mount) return;

    this.captchaConfigured.set(true);
    this.captchaWidgetId = window.turnstile.render(mount, {
      sitekey: siteKey,
      theme: 'light',
      callback: (token) => this.captchaToken.set(token),
      'expired-callback': () => this.captchaToken.set(''),
    });
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected submitEnquiry(event: SubmitEvent): void {
    event.preventDefault();
    this.submitState.set('idle');

    submit(this.enquiryForm, async () => {
      if (!this.captchaConfigured() && !isDevMode()) {
        this.submitState.set('error');
        return;
      }

      this.isSubmitting.set(true);
      try {
        await this.enquiryService.submit({
          ...this.enquiryModel(),
          turnstileToken: this.captchaToken(),
        });
        this.submitState.set('success');
        this.enquiryForm().reset();
        this.captchaToken.set('');
        window.turnstile?.reset(this.captchaWidgetId);
      } catch {
        this.submitState.set('error');
      } finally {
        this.isSubmitting.set(false);
      }
    });
  }
}
