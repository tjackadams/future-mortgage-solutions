import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export const SITE_URL = 'https://futuremortgagesolutions.co.uk';

export interface SeoPage {
  readonly title: string;
  readonly description: string;
  readonly path: '' | '/privacy';
  readonly robots: string;
  readonly structuredData?: Record<string, unknown>;
}

const logoUrl = `${SITE_URL}/future-mortgage-solutions-logo.png`;

export const homeSeo: SeoPage = {
  title: 'Faye Adams | UK Mortgage & Protection Adviser | Future Mortgage Solutions',
  description:
    'Mortgage and protection advice from Faye Adams at Future Mortgage Solutions. Residential, remortgage, buy-to-let and specialist options for UK expats, foreign nationals and overseas investors.',
  path: '',
  robots: 'index,follow,max-image-preview:large',
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: 'Future Mortgage Solutions Ltd',
    legalName: 'Future Mortgage Solutions Ltd',
    url: SITE_URL,
    logo: logoUrl,
    image: logoUrl,
    description:
      'UK mortgage and protection advice for residential borrowers, investors, expats, foreign nationals and overseas clients.',
    telephone: '+447551302505',
    email: 'faye@futuremortgagesolutions.co.uk',
    areaServed: { '@type': 'Country', name: 'United Kingdom' },
    employee: {
      '@type': 'Person',
      name: 'Faye Adams',
      jobTitle: 'Mortgage & Protection Adviser',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Mortgage advice services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Residential mortgages' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'First-time buyer mortgages' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Buy-to-let and portfolio mortgages' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Remortgaging' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Specialist mortgages for expats and foreign nationals' } },
      ],
    },
  },
};

export const privacySeo: SeoPage = {
  title: 'Privacy notice | Future Mortgage Solutions',
  description: 'Read the Future Mortgage Solutions privacy notice.',
  path: '/privacy',
  robots: 'noindex,follow',
};

@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(page: SeoPage): void {
    const canonicalUrl = `${SITE_URL}${page.path}`;
    this.title.setTitle(page.title);
    this.setName('description', page.description);
    this.setName('robots', page.robots);
    this.setProperty('og:locale', 'en_GB');
    this.setProperty('og:site_name', 'Future Mortgage Solutions');
    this.setProperty('og:type', 'website');
    this.setProperty('og:title', page.title);
    this.setProperty('og:description', page.description);
    this.setProperty('og:url', canonicalUrl);
    this.setProperty('og:image', logoUrl);
    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', page.title);
    this.setName('twitter:description', page.description);
    this.setName('twitter:image', logoUrl);
    this.setCanonical(canonicalUrl);
    this.setStructuredData(page.structuredData);
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content }, `name='${name}'`);
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property='${property}'`);
  }

  private setCanonical(url: string): void {
    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  private setStructuredData(data: Record<string, unknown> | undefined): void {
    this.document.head.querySelector('#structured-data')?.remove();
    if (!data) return;

    const script = this.document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }
}
