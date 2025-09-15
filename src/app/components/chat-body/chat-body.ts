// src/app/components/chat-body/chat-body.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService, ChatMessage } from '../../services/chat';

@Component({
  selector: 'app-chat-body',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-body.html',
  styleUrl: './chat-body.css'
})
export class ChatBody implements OnInit {
  messages: ChatMessage[] = [];
  currentUserId!: string;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.currentUserId = this.chatService.getCurrentUser().id;
    this.loadMessages();

    this.chatService.listenForMessages((msg) => {
      if (this.isMessageWithSelectedUser(msg)) {
        this.messages = [...this.messages, msg];
      }
    });

    this.chatService.onSelectedUserChange(() => this.loadMessages());
  }

  loadMessages() {
    const selectedUserId = this.chatService.getSelectedUser();
    if (!selectedUserId) {
      this.messages = [];
      return;
    }
    this.messages = this.chatService.getMessages().filter(msg =>
      (msg.from.id === this.currentUserId && msg.to === selectedUserId) ||
      (msg.from.id === selectedUserId && msg.to === this.currentUserId)
    );
  }

  isMessageWithSelectedUser(msg: ChatMessage): boolean {
    const selectedUserId = this.chatService.getSelectedUser();
    return selectedUserId !== null && (
      (msg.from.id === this.currentUserId && msg.to === selectedUserId) ||
      (msg.from.id === selectedUserId && msg.to === this.currentUserId)
    );
  }

  isOwnMessage(msg: ChatMessage): boolean {
    return msg.from.id === this.currentUserId;
  }

  // Format message text and leave clickable links
  formatMessage(msg: ChatMessage) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return msg.text.replace(urlRegex, (url) => `<a href="${url}" target="_blank">${url}</a>`);
  }
}