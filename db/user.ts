import db from "./database";

export type PermissonID =
  | "raise_inspiration"
  | "raise_issue"
  | "comment"
  | "change_nick"
  | "change_avatar"
  | "change_biography";

export interface Permission {
  id: PermissonID
  granted: boolean
  reason?: string
  expireTime: Date
}

export interface User {
  permissions: Permission[]
  _id: UserID
  nick: string
  avatar: string
  biography: string
  registerTime: Date
}

export type UserID = string

export async function getUser(id: UserID): Promise<User | null> {
  return db.collection<User>('users').findOne({ _id: id });
}