import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs, allLeaflets } from 'contentlayer/generated'
import Main from './Main'
import { asBlog } from './helpers'

export default async function Page() {
  const posts = allCoreContent(sortPosts(allBlogs.concat(allLeaflets.map(asBlog))))
  return <Main posts={posts} />
}
