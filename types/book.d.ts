export type typeFlow = 'paginated' | 'scrolled-doc'

export type typeTheme = 'tan' | 'dark' | 'light'

export interface IFront {
  id: number
  name: string
}

export interface IMeta {
  creator?: string
  description: string
  direction?: string
  flow: string
  identifier?: string
  language?: string
  layout?: string
  media_active_class?: string
  modified_date?: string
  orientation?: string
  pubdate?: string
  publisher?: string
  rights?: string
  spread?: string
  title: string
  viewport?: string
}

export interface IBookInfo {
  id: number
  cover: string | null
  meta: any // Adjust the type according to your metadata structure
}

export interface IStateBook {
  fontSize: number;
  fontFamily: string;
  theme: typeTheme;
  flow: typeFlow;
}
