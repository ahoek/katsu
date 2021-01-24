export interface JishoSense {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  parts_of_speech: string[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  english_definitions: string[];
}

export interface JishoJapanese {
  word?: string;
  reading: string;
}

export interface JishoDefinition {
  senses: Array<JishoSense>;
  japanese: Array<JishoJapanese>;
  level?: number;
}
