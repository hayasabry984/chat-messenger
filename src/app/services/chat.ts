import { Injectable } from '@angular/core';

export interface User { id: string; name: string; avatar: string; }
export interface LinkPreview { title: string; description: string; image: string; domain: string; }
export interface ChatMessage { id: string; from: User; to: string; text: string; timestamp: number; linkPreview?: LinkPreview; }

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
  private usersUpdateCallback?: () => void;
  private selectedUserChangeCallback?: () => void;

  constructor() {
    // Load current user or create new
    const savedUser = sessionStorage.getItem('chat-user');
    if (savedUser) this.currentUser = JSON.parse(savedUser);
    else {
      const randomId = Math.random().toString(36).substring(2, 9);
      const randomName = 'User' + Math.floor(Math.random() * 1000);
      const randomAvatar = this.avatars[Math.floor(Math.random() * this.avatars.length)];
      this.currentUser = { id: randomId, name: randomName, avatar: randomAvatar };
      sessionStorage.setItem('chat-user', JSON.stringify(this.currentUser));
    }

    // Load messages from localStorage
    const savedMessages = localStorage.getItem('chat-messages');
    if (savedMessages) this.messages = JSON.parse(savedMessages);

    this.channel = new BroadcastChannel('chat_app');

    // Add current user locally
    this.users.push(this.currentUser);

    // Notify other tabs about this user
    this.channel.postMessage({ type: 'join', user: this.currentUser });

    // Listen to broadcast messages
    this.channel.onmessage = (event) => {
      const data = event.data;

      switch (data.type) {
        case 'join':
          if (!this.users.find(u => u.id === data.user.id)) {
            this.users.push(data.user);
            this.broadcastUserList(); // send updated list to all
            this.usersUpdateCallback?.();
          }
          break;

        case 'user-list':
          data.users.forEach((u: User) => {
            if (!this.users.find(x => x.id === u.id)) this.users.push(u);
          });
          this.usersUpdateCallback?.();
          break;

        case 'leave':
          this.users = this.users.filter(u => u.id !== data.userId);
          this.usersUpdateCallback?.();
          break;

        case 'message':
          const msg: ChatMessage = data.message;
          if (!this.messages.find(m => m.id === msg.id)) {
            this.messages.push(msg);
            localStorage.setItem('chat-messages', JSON.stringify(this.messages));
            this.messageCallback?.(msg);
          }
          break;
      }
    };

    // Handle tab close
    window.addEventListener('beforeunload', () => {
      this.channel.postMessage({ type: 'leave', userId: this.currentUser.id });
    });
  }

  // --- USERS ---
  getCurrentUser(): User { return this.currentUser; }
  getAllUsers(): User[] { return this.users; }

  onUsersUpdate(callback: () => void) { this.usersUpdateCallback = callback; }

  setSelectedUser(userId: string) {
    this.selectedUserId = userId;
    this.selectedUserChangeCallback?.();
  }

  getSelectedUser(): string | null { return this.selectedUserId; }
  onSelectedUserChange(callback: () => void) { this.selectedUserChangeCallback = callback; }

  // --- MESSAGES ---
  getMessages(): ChatMessage[] { return this.messages; }

  async sendMessage(to: string, text: string) {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      from: this.currentUser,
      to,
      text,
      timestamp: Date.now()
    };

    // Check for link preview
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      const preview = await this.fetchLinkPreview(urlMatch[0]);
      if (preview) msg.linkPreview = preview;
    }

    this.messages.push(msg);
    localStorage.setItem('chat-messages', JSON.stringify(this.messages));
    this.channel.postMessage({ type: 'message', message: msg });
    this.messageCallback?.(msg);
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

  private broadcastUserList() {
    this.channel.postMessage({ type: 'user-list', users: this.users });
  }
}