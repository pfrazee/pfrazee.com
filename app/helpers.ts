import type { Leaflet, Blog } from "contentlayer/generated";
import { facet } from "@/util/pub/leaflet/richtext";

export type Post = Leaflet | Blog

export function sortPosts(posts: Post[]): Post[] {
  return posts.sort(dateSortDesc)
}

function dateSortDesc(aPost: Post, bPost: Post) {
  const a = aPost.type === 'Blog' ? aPost.date : aPost.publishedAt
  const b = bPost.type === 'Blog' ? bPost.date : bPost.publishedAt

  if (a > b)
    return -1;
  if (a < b)
    return 1;
  return 0;
}


export function asBlog(leaflet: Leaflet): Blog {
  return {
    ...leaflet,
    type: 'Blog',
    summary: leaflet.description,
    date: leaflet.publishedAt,
    tags: [],
    body: {raw: '', code: ''}
  }
}

export class RichTextSegment {
  constructor(
    public text: string,
    public facet?: facet.Main,
  ) {}
}

export class RichText {
  unicodeText: UnicodeString
  facets?: facet.Main[]

  constructor(text: string, facets?: facet.Main[]) {
    this.unicodeText = new UnicodeString(text)
    this.facets = facets
    if (this.facets) {
      this.facets = this.facets.filter(facetFilter).sort(facetSort)
    }
  }

  get text() {
    return this.unicodeText.toString()
  }

  get length() {
    return this.unicodeText.length
  }

  *segments(): Generator<RichTextSegment, void, void> {
    const facets = this.facets || []
    if (!facets.length) {
      yield new RichTextSegment(this.unicodeText.utf16)
      return
    }

    let textCursor = 0
    let facetCursor = 0
    do {
      const currFacet = facets[facetCursor]
      if (textCursor < currFacet.index.byteStart) {
        yield new RichTextSegment(
          this.unicodeText.slice(textCursor, currFacet.index.byteStart),
        )
      } else if (textCursor > currFacet.index.byteStart) {
        facetCursor++
        continue
      }
      if (currFacet.index.byteStart < currFacet.index.byteEnd) {
        const subtext = this.unicodeText.slice(
          currFacet.index.byteStart,
          currFacet.index.byteEnd,
        )
        if (!subtext.trim()) {
          // dont empty string entities
          yield new RichTextSegment(subtext)
        } else {
          yield new RichTextSegment(subtext, currFacet)
        }
      }
      textCursor = currFacet.index.byteEnd
      facetCursor++
    } while (facetCursor < facets.length)
    if (textCursor < this.unicodeText.length) {
      yield new RichTextSegment(
        this.unicodeText.slice(textCursor, this.unicodeText.length),
      )
    }
  }
}

const facetSort = (a: facet.Main, b: facet.Main) => a.index.byteStart - b.index.byteStart

const facetFilter = (facet: facet.Main) =>
  // discard negative-length facets. zero-length facets are valid
  facet.index.byteStart <= facet.index.byteEnd

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export class UnicodeString {
  utf16: string
  utf8: Uint8Array

  constructor(utf16: string) {
    this.utf16 = utf16
    this.utf8 = encoder.encode(utf16)
  }

  get length() {
    return this.utf8.byteLength
  }

  slice(start?: number, end?: number): string {
    return decoder.decode(this.utf8.slice(start, end))
  }

  utf16IndexToUtf8Index(i: number) {
    return encoder.encode(this.utf16.slice(0, i)).byteLength
  }

  toString() {
    return this.utf16
  }
}