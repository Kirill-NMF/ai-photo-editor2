declare module "react-telegram-login" {
  import * as React from "react";

  export interface TelegramUser {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
    auth_date?: number;
    hash: string;
    [key: string]: unknown;
  }

  export interface TelegramLoginButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    botName: string;
    dataOnauth?: (user: TelegramUser) => void;
    dataAuthUrl?: string;
    requestAccess?: "write";
    usePic?: boolean;
    cornerRadius?: number;
    buttonSize?: "large" | "medium" | "small";
  }

  export default function TelegramLoginButton(
    props: TelegramLoginButtonProps,
  ): JSX.Element;
}
