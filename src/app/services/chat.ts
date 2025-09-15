// src/app/services/chat.ts
import { Injectable } from '@angular/core';

export interface User { id: string; name: string; avatar: string; }

export interface LinkPreview {
  title: string;
  description: string;
  image: string;
  domain: string;
}

export interface ChatMessage {
  id: string;
  from: User;
  to: string;
  text: string;
  timestamp: number;
  linkPreview?: LinkPreview;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private avatars = [
    'https://i.pravatar.cc/100?img=1',
    'https://i.pravatar.cc/100?img=5',
    'https://i.pravatar.cc/100?img=12',
    'https://i.pravatar.cc/100?img=26',
    'https://i.pravatar.cc/100?img=31'
  ];

  private currentUser!: User;
  private channel: BroadcastChannel;
  private messages: ChatMessage[] = [];
  private users: User[] = [];
  private selectedUserId: string | null = null;
  private messageCallback?: (msg: ChatMessage) => void;
  private selectedUserChangeCallback?: () => void;

  constructor() {
    const savedUser = sessionStorage.getItem('chat-user');
    if (savedUser) this.currentUser = JSON.parse(savedUser);
    else {
      const randomId = Math.random().toString(36).substring(2, 9);
      const randomName = 'User' + Math.floor(Math.random() * 1000);
      const randomAvatar = this.avatars[Math.floor(Math.random() * this.avatars.length)];
      this.currentUser = { id: randomId, name: randomName, avatar: randomAvatar };
      sessionStorage.setItem('chat-user', JSON.stringify(this.currentUser));
    }

    this.channel = new BroadcastChannel('chat_app');
    this.users.push(this.currentUser);
    this.channel.postMessage({ type: 'join', user: this.currentUser });

    this.channel.onmessage = (event) => {
      const data = event.data;

      if (data.type === 'join') {
        if (!this.users.find(u => u.id === data.user.id)) this.users.push(data.user);
        if (data.user.id !== this.currentUser.id) {
          this.channel.postMessage({ type: 'join', user: this.currentUser });
        }
      }

      if (data.type === 'message') {
        const msg = data.message as ChatMessage;
        if (!this.messages.find(m => m.id === msg.id)) {
          this.messages.push(msg);
          if (this.messageCallback) this.messageCallback(msg);
        }
      }
    };
  }

  getCurrentUser(): User { return this.currentUser; }
  getAllUsers(): User[] { return this.users; }
  setSelectedUser(userId: string) {
    this.selectedUserId = userId;
    if (this.selectedUserChangeCallback) this.selectedUserChangeCallback();
  }
  getSelectedUser(): string | null { return this.selectedUserId; }
  onSelectedUserChange(callback: () => void) { this.selectedUserChangeCallback = callback; }
  getMessages(): ChatMessage[] { return this.messages; }

  // --- Send message (only once, with preview if available) ---
  async sendMessage(to: string, text: string) {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      from: this.currentUser,
      to,
      text,
      timestamp: Date.now()
    };

    // Check for link preview BEFORE sending
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      const preview = await this.fetchLinkPreview(urlMatch[0]);
      if (preview) {
        msg.linkPreview = preview;
      }
    }

    // Push + broadcast only once
    this.messages.push(msg);
    this.channel.postMessage({ type: 'message', message: msg });
    if (this.messageCallback) this.messageCallback(msg);
  }

  listenForMessages(callback: (msg: ChatMessage) => void) {
    this.messageCallback = callback;
  }

  private async fetchLinkPreview(url: string): Promise<LinkPreview | undefined> {
    try {
      const response = await fetch(`http://localhost/preview-proxy.php?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      return {
        title: data.title || '',
        description: data.description || '',
        image: data.image || '',
        domain: data.domain || new URL(url).hostname
      };
    } catch (err) {
      console.warn('Link preview fetch failed:', err);
      return undefined;
    }
  }
}