export type TGChatId = string | number;

export interface ITGUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ITGChatPhoto {
  small_file_id?: string;
  big_file_id?: string;
}

export interface ITGChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  all_members_are_administrators?: boolean;
  photo?: ITGChatPhoto;
  description?: string;
  invite_link?: string;
  pinned_message?: ITGMessage;
  sticker_set_name?: string;
  can_set_sticker_set?: boolean;
}

export interface ITGMessage {
  message_id: number;
  from?: ITGUser;
  date: number;
  chat: ITGChat;
  forward_from?: ITGUser;
  forward_from_chat?: ITGChat;
  forward_from_message_id?: number;
  forward_signature?: string;
  forward_date?: number;
  reply_to_message?: ITGMessage;
  edit_date?: number;
  media_group_id?: string;
  author_signature?: string;
  text?: string;
}

export interface ITGUpdate {
  update_id: number;
  message?: ITGMessage;
}

export interface ITGSendMessageOpt {
  chat_id: TGChatId;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
}

export interface ITGSendMessageReducedOpt {
  parse_mode?: 'Markdown' | 'HTML';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
}
