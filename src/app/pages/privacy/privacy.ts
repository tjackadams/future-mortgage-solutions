import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { privacySeo, Seo } from '../../services/seo';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  templateUrl: './privacy.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Privacy implements OnInit {
  private readonly seo = inject(Seo);

  ngOnInit(): void {
    this.seo.apply(privacySeo);
  }
}
