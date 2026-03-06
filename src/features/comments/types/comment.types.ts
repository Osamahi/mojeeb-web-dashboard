export interface SocialPost {
  id: string;
  connectionId: string;
  platform: 'facebook' | 'instagram';
  postId: string;
  postCaption: string | null;
  postImageUrl: string | null;
  postPermalink: string | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialComment {
  id: string;
  postDbId: string;
  platform: 'facebook' | 'instagram';
  commentId: string;
  parentCommentId: string | null;
  commentText: string;
  commenterName: string | null;
  commenterUsername: string | null;
  commenterProfilePic: string | null;
  aiResponse: string | null;
  replyMethod: 'public_reply' | 'private_dm';
  status: 'pending' | 'processing' | 'replied' | 'failed' | 'skipped';
  errorMessage: string | null;
  repliedAt: string | null;
  isReplyToOwn: boolean;
  platformReplyId: string | null;
  commentCreatedAt: string | null;
  createdAt: string;
}

export interface CommentStats {
  pending: number;
  processing: number;
  replied: number;
  failed: number;
  skipped: number;
  total: number;
}

// API response types (snake_case from backend)
export interface ApiSocialPost {
  id: string;
  connection_id: string;
  platform: string;
  post_id: string;
  post_caption: string | null;
  post_image_url: string | null;
  post_permalink: string | null;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiSocialComment {
  id: string;
  post_db_id: string;
  platform: string;
  comment_id: string;
  parent_comment_id: string | null;
  comment_text: string;
  commenter_name: string | null;
  commenter_username: string | null;
  commenter_profile_pic: string | null;
  ai_response: string | null;
  reply_method: string;
  status: string;
  error_message: string | null;
  replied_at: string | null;
  is_reply_to_own: boolean;
  platform_reply_id: string | null;
  comment_created_at: string | null;
  created_at: string;
}

export interface ApiCommentStats {
  pending: number;
  processing: number;
  replied: number;
  failed: number;
  skipped: number;
  total: number;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  has_more: boolean;
  next_cursor: string | null;
}
