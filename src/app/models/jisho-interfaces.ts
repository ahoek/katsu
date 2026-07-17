export interface JishoSense {
   
  parts_of_speech: string[];
   
  english_definitions: string[];
}

export interface JishoJapanese {
  word?: string;
  reading: string;
}

export interface JishoDefinition {
  senses: JishoSense[];
  japanese: JishoJapanese[];
  level?: number;
}
