import api from '@/lib/api';
import type {
  SocialPost,
  SocialComment,
  CommentStats,
  ApiSocialPost,
  ApiSocialComment,
  ApiCommentStats,
  CursorPaginatedResponse,
} from '../types/comment.types';

const BASE_PATH = '/api/comments';

class CommentService {
  private transformPost(apiPost: ApiSocialPost): SocialPost {
    return {
      id: apiPost.id,
      connectionId: apiPost.connection_id,
      platform: apiPost.platform as 'facebook' | 'instagram',
      postId: apiPost.post_id,
      postCaption: apiPost.post_caption,
      postImageUrl: apiPost.post_image_url,
      postPermalink: apiPost.post_permalink,
      commentCount: apiPost.comment_count,
      createdAt: apiPost.created_at,
      updatedAt: apiPost.updated_at,
    };
  }

  private transformComment(apiComment: ApiSocialComment): SocialComment {
    return {
      id: apiComment.id,
      postDbId: apiComment.post_db_id,
      platform: apiComment.platform as 'facebook' | 'instagram',
      commentId: apiComment.comment_id,
      parentCommentId: apiComment.parent_comment_id,
      commentText: apiComment.comment_text,
      commenterName: apiComment.commenter_name,
      commenterUsername: apiComment.commenter_username,
      commenterProfilePic: apiComment.commenter_profile_pic,
      aiResponse: apiComment.ai_response,
      replyMethod: apiComment.reply_method as 'public_reply' | 'private_dm',
      status: apiComment.status as SocialComment['status'],
      errorMessage: apiComment.error_message,
      repliedAt: apiComment.replied_at,
      isReplyToOwn: apiComment.is_reply_to_own,
      platformReplyId: apiComment.platform_reply_id,
      commentCreatedAt: apiComment.comment_created_at,
      createdAt: apiComment.created_at,
    };
  }

  async getAllPosts(
    agentId: string,
    limit = 50,
    cursor?: string
  ): Promise<{ items: SocialPost[]; hasMore: boolean; nextCursor: string | null }> {
    const params: Record<string, string | number> = {
      agent_id: agentId,
      limit,
    };
    if (cursor) params.cursor = cursor;

    const { data } = await api.get<{ data: CursorPaginatedResponse<ApiSocialPost> }>(
      `${BASE_PATH}/all-posts`,
      { params }
    );

    return {
      items: data.data.items.map(p => this.transformPost(p)),
      hasMore: data.data.has_more,
      nextCursor: data.data.next_cursor,
    };
  }

  async getPostComments(
    postDbId: string,
    limit = 50,
    cursor?: string
  ): Promise<{ items: SocialComment[]; hasMore: boolean; nextCursor: string | null }> {
    const params: Record<string, string | number> = { limit };
    if (cursor) params.cursor = cursor;

    const { data } = await api.get<{ data: CursorPaginatedResponse<ApiSocialComment> }>(
      `${BASE_PATH}/posts/${postDbId}/comments`,
      { params }
    );

    return {
      items: data.data.items.map(c => this.transformComment(c)),
      hasMore: data.data.has_more,
      nextCursor: data.data.next_cursor,
    };
  }

  async getAllStats(agentId: string): Promise<CommentStats> {
    const { data } = await api.get<{ data: ApiCommentStats }>(
      `${BASE_PATH}/all-stats`,
      { params: { agent_id: agentId } }
    );

    return data.data;
  }

  async retryComment(commentId: string): Promise<void> {
    await api.post(`${BASE_PATH}/${commentId}/retry`);
  }

  async deleteReply(commentId: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${commentId}/reply`);
  }

  async manualReply(commentId: string, message: string): Promise<void> {
    await api.post(`${BASE_PATH}/${commentId}/manual-reply`, { message });
  }
}

export const commentService = new CommentService();
