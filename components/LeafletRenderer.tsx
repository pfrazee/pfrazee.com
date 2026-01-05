import type { linearDocument } from "@/util/pub/leaflet/pages"
import * as blocks from '@/util/pub/leaflet/blocks'
import * as facets from '@/util/pub/leaflet/richtext/facet'
import Image from '@/components/Image'
import { RichText, RichTextSegment } from "app/helpers"
import { jsonToLex, JsonValue } from '@atproto/lex-json'
import { toExt } from '@/util/helpers.ts'
import { BlueskyPostEmbed } from "./post-embed/BlueskyPostEmbed"

export function LeafletRenderer({pages}: {pages: linearDocument.Main[]}) {
  // HACK due to limitations in the contentbuilder framework, we have to do this cast here
  pages = jsonToLex(pages as JsonValue)! as linearDocument.Main[]

  const blocks = pages[0].blocks
  return (
    <div className="prose max-w-none dark:prose-invert">
      {blocks.map((block, i) => (
        <LeafletBlock key={`block-${i}`} block={block} />
      ))}
    </div>
  )
}

function LeafletBlock({block}: {block: linearDocument.Block}) {
  const innerBlock = block.block
  if (blocks.header.main.$matches(innerBlock)) {
    return <LeafletBlockHeader block={innerBlock} />
  }
  if (blocks.text.main.$matches(innerBlock)) {
    return <LeafletBlockText block={innerBlock} />
  }
  if (blocks.blockquote.main.$matches(innerBlock)) {
    return <LeafletBlockQuote block={innerBlock} />
  }
  if (blocks.horizontalRule.main.$matches(innerBlock)) {
    return <hr />
  }
  if (blocks.unorderedList.main.$matches(innerBlock)) {
    return <LeafletBlockUl block={innerBlock} />
  }
  if (blocks.website.main.$matches(innerBlock)) {
    return <LeafletBlockWebsite block={innerBlock} />
  }
  if (blocks.image.main.$matches(innerBlock)) {
    return <LeafletBlockImage block={innerBlock} />
  }
  if (blocks.bskyPost.main.$matches(innerBlock)) {
    return <LeafletBlockBskyPost block={innerBlock} />
  }
  if (blocks.code.main.$matches(innerBlock)) {
    return <LeafletBlockCode block={innerBlock} />
  }
  console.warn('Warning! Unhandled block in leaflet', innerBlock.$type, innerBlock)
  return <div><strong>TODO: {innerBlock.$type}</strong></div>
}

function LeafletBlockHeader({block}: {block: blocks.header.Main}) {
  const level = (block.level || 1) + 1 // add 1 because the title is the h1
  if (level === 2) {
    return <h2><RenderRichText rt={new RichText(block.plaintext, block.facets)} /></h2>
  }
  if (level === 3) {
    return <h3><RenderRichText rt={new RichText(block.plaintext, block.facets)} /></h3>
  }
  if (level === 4) {
    return <h4><RenderRichText rt={new RichText(block.plaintext, block.facets)} /></h4>
  }
  if (level === 5) {
    return <h5><RenderRichText rt={new RichText(block.plaintext, block.facets)} /></h5>
  }
  if (level === 6) {
    return <h6><RenderRichText rt={new RichText(block.plaintext, block.facets)} /></h6>
  }
  return <h1><RenderRichText rt={new RichText(block.plaintext, block.facets)} /></h1>
}

function LeafletBlockText({block}: {block: blocks.text.Main}) {
  return <p><RenderRichText rt={new RichText(block.plaintext, block.facets)} /></p>
}

function LeafletBlockQuote({block}: {block: blocks.blockquote.Main}) {
  return <blockquote><RenderRichText rt={new RichText(block.plaintext, block.facets)} /></blockquote>
}

function LeafletBlockUl({block}: {block: blocks.unorderedList.Main | blocks.unorderedList.ListItem}) {
  return (
    <ul>
      {(block.children || []).map((child, i) => (
        <li key={`ul-${i}`}>
          <LeafletBlock block={{block: child.content}} key={`ul-${i}`} />
          {child.children && <LeafletBlockUl block={child} />}
        </li>
      ))}
    </ul>
  )
}

function LeafletBlockWebsite({block}: {block: blocks.website.Main}) {
  return (
    <a className="flex border border-gray-200 dark:border-gray-800 rounded my-4 no-underline max-w-lg" href={block.src} target="_blank">
      {block.previewImage && (
        <div className="border-r border-gray-200 dark:border-gray-800">
          <Image className="mt-0 mb-0 w-[140px]" src={`/static/images/leaflets/${block.previewImage.ref.toString()}.${toExt(block.previewImage.mimeType)}`} alt="" />
        </div>
      )}
      <div className="flex-1 flex flex-col gap-2 px-5 py-4">
        {block.title && (<div className="font-bold text-base leading-snug">{block.title}</div>)}
        {block.description && (<div className="text-gray-600 dark:text-gray-400 text-sm leading-snug">{block.description}</div>)}
        {/* <div className={`text-xs text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 leading-snug ${(block.title || block.description) ? 'border-t pt-4 mt-2' : ''}`}>{block.src}</div> */}
      </div>
    </a>
  )
}

function LeafletBlockImage({block}: {block: blocks.image.Main}) {
  return (
    <Image src={`/static/images/leaflets/${block.image.ref.toString()}.${toExt(block.image.mimeType)}`} alt="" />
  )
}

function LeafletBlockBskyPost({block}: {block: blocks.bskyPost.Main}) {
  return (
    <BlueskyPostEmbed uri={block.postRef.uri} cid={block.postRef.cid} />
  )
}

function LeafletBlockCode({block}: {block: blocks.code.Main}) {
  return (
    <pre><code  className={`code-highlight language-${block.language}`}>{block.plaintext}</code></pre>
  )
}

function RenderRichText({rt}: {rt: RichText}) {
  return (
    <>
      {Array.from(rt.segments()).map((segment, i) => 
        <RenderRichTextSegment key={`segment-${i}`} segment={segment} />
      )}
    </>
  )
}

function RenderRichTextSegment({segment}: {segment: RichTextSegment}) {
  let cls = ''
  const linkFeature = segment.facet?.features.find(f => facets.link.$matches(f)) as facets.Link
  if (segment.facet) {
    cls = segment.facet.features.map(feature => {
      if (facets.bold.$matches(feature)) {
        return 'font-bold'
      }
      if (facets.italic.$matches(feature)) {
        return 'italic'
      }
      if (facets.code.$matches(feature)) {
        return 'font-mono'
      }
      if (facets.underline.$matches(feature)) {
        return 'underline'
      }
      if (facets.strikethrough.$matches(feature)) {
        return 'line-through'
      }
      if (facets.highlight.$matches(feature)) {
        return 'bg-yellow-400'
      }
      if (facets.link.$matches(feature)) {
        return 'underline hover:text-blue-400'
      }
      console.warn('Warning! Unhandled facet in leaflet text block', feature)
      return ''
    }).join(' ')
  }
  if (linkFeature) {
    return (
    <a className={cls} href={linkFeature.uri} target="_blank">
      {segment.text}
    </a>
    )
  }
  return (
    <span  className={cls}>
      {segment.text}
    </span>
  )
}