import { Injectable, effect, inject, signal } from '@angular/core';
import { Session } from '../../core/session/session';
import type { NumericPublicProfile } from '../../core/api/types.gen';

export interface SearchSnapshot {
  target: string;
  query: string;
  input: string;
  items: NumericPublicProfile[];
  cursor: string | null;
  searched: boolean;
  scrollTop: number;
}

// One navigation snapshot, in memory only. Never restore another session's state.
@Injectable({ providedIn: 'root' })
export class SearchReturn {
  private readonly session = inject(Session);
  private readonly snapshot = signal<(SearchSnapshot & { revision: number }) | undefined>(
    undefined,
  );
  constructor() {
    effect(() => {
      if (!this.session.authenticated()) this.clear();
    });
  }
  save(value: SearchSnapshot) {
    this.snapshot.set({ ...value, revision: this.session.revision() });
  }
  read() {
    const value = this.snapshot();
    return this.session.authenticated() && value?.revision === this.session.revision()
      ? value
      : undefined;
  }
  clear() {
    this.snapshot.set(undefined);
  }
}
