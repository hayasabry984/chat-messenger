import { Component } from '@angular/core';

// Import your standalone components
import { ChatList } from './components/chat-list/chat-list';
import { ChatBody } from './components/chat-body/chat-body';
import { ChatBox } from './components/chat-box/chat-box';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatList, ChatBody, ChatBox],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'chat-messenger';
}