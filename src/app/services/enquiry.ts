import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface EnquiryPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
  privacyAccepted: boolean;
  website: string;
  turnstileToken: string;
}

@Injectable({ providedIn: 'root' })
export class Enquiry {
  private readonly http = inject(HttpClient);

  submit(payload: EnquiryPayload): Promise<void> {
    return firstValueFrom(this.http.post<void>('/api/enquiries', payload));
  }
}
