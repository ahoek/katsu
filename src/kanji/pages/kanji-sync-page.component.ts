import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

import { installKanjiTranslations } from '../i18n/kanji-translations';
import { KanjiSrsService } from '../kanji-srs.service';
import { KanjiSyncService, SyncError, SyncOutcome } from '../sync/kanji-sync.service';

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
  ],
})
export class KanjiSyncPageComponent {
  private readonly translate = inject(TranslateService);
  protected readonly srs = inject(KanjiSrsService);
  protected readonly sync = inject(KanjiSyncService);

  readonly entered = signal('');
  readonly outcome = signal<SyncOutcome | undefined>(undefined);
  readonly error = signal('');
  readonly copied = signal(false);

  constructor() {
    installKanjiTranslations(this.translate);
    addIcons({ arrowBack, checkmarkCircle, copyOutline, downloadOutline, refreshOutline });
    this.srs.load();
  }

  async createCode(): Promise<void> {
    await this.run(async () => {
      await this.sync.createCode();
      return undefined;
    });
  }

  async useCode(): Promise<void> {
    await this.run(() => this.sync.useCode(this.entered()));
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
