import { FormsModule } from '@angular/forms'; 
import { Component, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from '../../services/chat';

@Component({
  selector: 'app-chat-box',
  standalone: true,
  templateUrl: './chat-box.html',
  styleUrl: './chat-box.css',
  imports: [FormsModule]
})
export class ChatBox {
  messageText = '';
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLInputElement>;

  constructor(private chatService: ChatService) {}

  sendMessage() {
    const selectedUserId = this.chatService.getSelectedUser();
    if (!this.messageText.trim() || !selectedUserId) return;

    this.chatService.sendMessage(selectedUserId, this.messageText);
    this.messageText = '';
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault(); // prevent form submission or newline
      this.sendMessage();
    }
  }
}