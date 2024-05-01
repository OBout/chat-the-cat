import { Component, h, State } from '@stencil/core';
import { CatClient, SocketResponse } from 'ccat-api';

interface ExtendedSocketResponse extends SocketResponse {
  user_id: string;
}

@Component({
  tag: 'chat-bot',
  styleUrl: 'chat-bot.css',
  shadow: true,
})



export class ChatBot {
  private cat = new CatClient({
    baseUrl: 'localhost',
    port: 1865,
    // apiKey: 'your-api-key'
  });

  // public messages: any;

  @State() isVisible: boolean = false;
  @State() userInput: string = '';
  @State() messages: Array<{ from: string; text: string }> = [];

  componentDidLoad() {
    this.cat.userId = 'new_user';
    this.cat
      .onConnected(() => {
        console.log('Socket connected');
      })
      .onMessage(msg => {
        console.log(msg);
        const msg_resp: ExtendedSocketResponse | any = msg;
        if (msg.type === 'chat' && msg_resp.user_id === 'new_user') {
          this.messages = [...this.messages, { from: 'cat', text: msg.content }];
        }
      })
      .onError(err => {
        console.log(err);
      })
      .onDisconnected(() => {
        console.log('Socket disconnected');
      });
  }

  toggleChat = () => {
    this.isVisible = !this.isVisible;
  };

  handleInput = (event: Event) => {
    this.userInput = (event.target as HTMLInputElement).value;
  };

  sendMessage = async () => {
    const message = this.userInput;
    this.messages = [...this.messages, { from: 'user', text: message }];
    this.cat.send(message);
    this.userInput = ''; // Clear input after sending
  };

  render() {
    return (
      <div>
        <button onClick={this.toggleChat}>Toggle Chat</button>
        {this.isVisible && (
          <div class="chat-interface">
            <div>
              {this.messages.map(msg => (
                <p class={msg.from}>{msg.text}</p>
              ))}
            </div>
            <input type="text" value={this.userInput} onInput={this.handleInput} />
            <button onClick={this.sendMessage}>Send</button>
          </div>
        )}
      </div>
    );
  }
}
