import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.css'
})
export class ChatList implements OnInit {
  users: any[] = [];
  currentUserId!: string;
  selectedUserId: string | null = null;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.currentUserId = this.chatService.getCurrentUser().id;
    this.users = this.chatService.getAllUsers();
    this.selectedUserId = this.chatService.getSelectedUser();
  }

  selectUser(userId: string) {
    this.chatService.setSelectedUser(userId);
    this.selectedUserId = userId;
  }

  isSelected(userId: string): boolean {
    return this.selectedUserId === userId;
  }
}