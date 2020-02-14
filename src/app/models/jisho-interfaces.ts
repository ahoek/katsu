interface JishoSense {
  parts_of_speech: string[];
  english_definitions: string[];
}

interface JishoJapanese {
  word?: string;
  reading: string;
}

interface JishoDefinition {
  senses: Array<JishoSense>;
  japanese: Array<JishoJapanese>;
  level?: number;
}
