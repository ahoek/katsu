import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBack, checkmarkCircle, copyOutline, downloadOutline, refreshOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { SyncQrComponent } from '../components/sync-qr.component';
import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiSrsService } from '../kanji-srs.service';
import { KanjiSyncService, SyncError, SyncOutcome } from '../sync/kanji-sync.service';
import { syncCodeFromFragment, syncCodeLink } from '../sync/sync-link';

/** What the file is called when the schedule is exported. */
const FILE_PREFIX = 'katsu-kanji';

@Component({
  selector: 'app-kanji-sync-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'kanji-sync-page.component.html',
  styleUrls: ['kanji-sync-page.component.scss'],
  imports: [
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonToolbar,
    TranslatePipe,
    SyncQrComponent,
  ],
})
export class KanjiSyncPageComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  protected readonly srs = inject(KanjiSrsService);
  protected readonly sync = inject(KanjiSyncService);

  readonly entered = signal('');
  readonly outcome = signal<SyncOutcome | undefined>(undefined);
  readonly error = signal('');
  readonly copied = signal(false);

  /** A code that arrived by camera, waiting for one tap to be used. */
  readonly scanned = signal('');

  /** The link behind the QR code: this device's code, on the sync screen. */
  readonly link = computed(() => {
    const code = this.sync.code();
    return code ? syncCodeLink(code, location.origin) : '';
  });

  /** How long ago this device last synced, for the line under the code. */
  readonly lastSync = computed(() => {
    const at = this.sync.syncedAt();
    if (!at) {
      return undefined;
    }
    const minutes = Math.max(0, Math.round((Date.now() - at) / 60_000));
    if (minutes < 1) {
      return { key: 'kanji.sync.last-now', value: 0 };
    }
    if (minutes < 60) {
      return { key: 'kanji.sync.last-minutes', value: minutes };
    }
    const hours = Math.round(minutes / 60);
    return hours < 24
      ? { key: 'kanji.sync.last-hours', value: hours }
      : { key: 'kanji.sync.last-days', value: Math.round(hours / 24) };
  });

  private fragmentChanges?: Subscription;

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowBack, checkmarkCircle, copyOutline, downloadOutline, refreshOutline });
    this.srs.load();
  }

  ngOnInit(): void {
    // Scanning the other device's QR lands here with the code in the fragment.
    // It is offered rather than used: joining a code also pushes this device's
    // schedule to it, which is not something a scanned link should do unasked.
    this.fragmentChanges = this.route.fragment.subscribe(fragment => {
      const code = syncCodeFromFragment(fragment);
      if (code && code !== this.sync.code()) {
        this.scanned.set(code);
        this.entered.set(code);
      }
    });
  }

  ngOnDestroy(): void {
    this.fragmentChanges?.unsubscribe();
  }

  async createCode(): Promise<void> {
    await this.run(async () => {
      await this.sync.createCode();
      return undefined;
    });
  }

  async useCode(): Promise<void> {
    if (this.sync.busy()) {
      return;
    }
    await this.run(() => this.sync.useCode(this.entered()));
    this.scanned.set('');
  }

  async syncNow(): Promise<void> {
    await this.run(() => this.sync.syncNow());
  }

  forget(): void {
    this.sync.forgetCode();
    this.outcome.set(undefined);
    this.error.set('');
  }

  /** Put the schedule in a file, which is the backup that needs no server. */
  async exportFile(): Promise<void> {
    const code = await this.sync.export();
    const stamp = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
    const link = document.createElement('a');

    link.href = url;
    link.download = `${FILE_PREFIX}-${stamp}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    // Let the same file be picked again after a failed attempt.
    input.value = '';
    await this.run(() => this.sync.import(text.trim()));
  }

  async copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.sync.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // No clipboard permission; the code is on screen to be read off.
    }
  }

  private async run(action: () => Promise<SyncOutcome | undefined>): Promise<void> {
    this.error.set('');
    this.outcome.set(undefined);
    try {
      this.outcome.set(await action());
    } catch (failure) {
      this.error.set(
        failure instanceof SyncError
          ? failure.message
          : this.translate.instant('kanji.sync.failed') as string,
      );
    }
  }
}
