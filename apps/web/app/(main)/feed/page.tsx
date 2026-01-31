import { Metadata } from 'next';
import { StoriesBar } from '@/components/feed/stories-bar';
import { PostList } from '@/components/feed/post-list';

export const metadata: Metadata = {
  title: 'Feed',
};

export default function FeedPage() {
  return (
    <div className="space-y-6">
      {/* Stories */}
      <StoriesBar />

      {/* Posts */}
      <PostList />
    </div>
  );
}
