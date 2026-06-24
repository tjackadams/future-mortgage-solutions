import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { homeSeo, privacySeo, Seo, SITE_URL } from './seo';

describe('Seo', () => {
  let seo: Seo;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    seo = TestBed.inject(Seo);
    document = TestBed.inject(DOCUMENT);
    document.head.replaceChildren();
  });

  it('publishes indexable UK-wide service metadata and structured data for the home page', () => {
    seo.apply(homeSeo);

    expect(document.title).toContain('Faye Adams');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(SITE_URL);
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('index,follow');
    const schema = JSON.parse(document.head.querySelector('#structured-data')?.textContent ?? '{}');
    expect(schema['@type']).toBe('FinancialService');
    expect(schema.areaServed.name).toBe('United Kingdom');
    expect(schema.employee.name).toBe('Faye Adams');
  });

  it('keeps the privacy page crawlable only through internal links and removes service structured data', () => {
    seo.apply(homeSeo);
    seo.apply(privacySeo);

    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_URL}/privacy`);
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,follow');
    expect(document.head.querySelector('#structured-data')).toBeNull();
  });
});
