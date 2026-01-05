import 'css/prism.css'
import 'katex/dist/katex.css'

import { allBlogs, allLeaflets, allAuthors } from 'contentlayer/generated'
import type { Authors, Leaflet } from 'contentlayer/generated'
import PostLayout from '@/layouts/PostLayout'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'
import type {Post} from '../../helpers'
import { sortPosts } from '../../helpers'
import { LeafletRenderer } from '@/components/LeafletRenderer'

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata | undefined> {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))
  const allPosts: Post[] = [...allBlogs, ...allLeaflets]
  const post = allPosts.find((p) => p.slug === slug)
  const authorList = (post?.type === 'Blog' ? post?.authors : ['default']) || ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return authorResults as Authors
  })
  if (post?.type !== 'Leaflet') {
    return
  }

  const publishedAt = new Date(post.publishedAt).toISOString()
  const authors = authorDetails.map((author) => author.name)
  const imageList = [siteMetadata.socialBanner]
  const ogImages = imageList.map((img) => {
    return {
      url: img.includes('http') ? img : siteMetadata.siteUrl + img,
    }
  })

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      siteName: siteMetadata.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: publishedAt,
      url: './',
      images: ogImages,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: imageList,
    },
  }

}

export const generateStaticParams = async () => {
  const paths = allBlogs.map((p) => ({ slug: p.slug.split('/') }))

  return paths
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params
  const slug = decodeURI(params.slug.join('/'))

  const allPosts: Post[] = sortPosts([...allBlogs, ...allLeaflets])
  const postIndex = allPosts.findIndex((p) => p.slug === slug)
  if (postIndex === -1 || allPosts[postIndex].type !== 'Leaflet') {
    return notFound()
  }

  const prev = allPosts[postIndex + 1]
  const next = allPosts[postIndex - 1]
  const post = allPosts.find((p) => p.slug === slug) as Leaflet
  const authorList = ['default']
  const authorDetails = authorList.map((author) => {
    const authorResults = allAuthors.find((p) => p.slug === author)
    return authorResults as Authors
  })
  const mainContent = post
  const jsonLd = post.structuredData
  jsonLd['author'] = authorDetails.map((author) => {
    return {
      '@type': 'Person',
      name: author.name,
    }
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostLayout content={mainContent} authorDetails={authorDetails} next={next} prev={prev}>
        <p className="bg-gray-100 dark:bg-gray-800 font-mono px-4 py-2 rounded text-sm">
          Posted via <a href={`https://pfrazee.leaflet.pub/${slug}`} target="_blank">Leaflet</a>
        </p>
        <LeafletRenderer pages={post.pages} />
      </PostLayout>
    </>
  )
}
