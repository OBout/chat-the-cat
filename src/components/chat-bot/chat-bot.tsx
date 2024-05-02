import { Component, h, State } from '@stencil/core';
import { CatClient, SocketResponse } from 'ccat-api';

interface ExtendedSocketResponse extends SocketResponse {
  user_id: string;
}

declare var webkitSpeechRecognition: any;

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

  private recognition = new webkitSpeechRecognition();
  private totalText = '';

  componentDidLoad() {
    console.log('Component loaded', this.totalText);

    if (!('webkitSpeechRecognition' in window)) {
      alert("Your browser does not support the Web Speech API. Please use Google Chrome, Firefox, or Edge.");
    }
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
          this.speakText(msg.content); // Speak out the message content
        }
        
      })
      .onError(err => {
        console.log(err);
      })
      .onDisconnected(() => {
        console.log('Socket disconnected');
      });
      
      this.recognition.continuous = true; // Capture continuous speech
      this.recognition.interimResults = true; // Show interim results
      this.recognition.onresult = (event) => { // Changed to an arrow function
        this.totalText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            this.totalText += event.results[i][0].transcript;
            console.log('result', this.totalText);
      
            const message = this.totalText;
            this.messages = [...this.messages, { from: 'user', text: message }];
            this.cat.send(message);
            this.totalText = ''; // Clear totalText after processing
          }
        }
      };      

  }

  speakText(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = speechSynthesis.getVoices().find(voice => voice.lang === 'en-US'); // Optionally select a voice, here for English US
    utterance.pitch = 1; // Set pitch, can be between 0 and 2
    utterance.rate = 1; // Set rate, can be between 0.1 and 10
    speechSynthesis.speak(utterance);
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

  startRecording = () => {
    this.recognition.start();
  };

  stopRecording = () => {
    this.recognition.stop();
  };

  render() {
    return (
      <div>
        <h1>Speak to our AI</h1>
        <button id="start-btn" onClick={this.startRecording}>Start Recognition</button>
        <button id="stop-btn" onClick={this.stopRecording}>Stop Recognition</button>
        <p id="text"></p>
        <hr>
        <div class="chat-interface">
            <div>
              {this.messages.map(msg => (
                <p class={msg.from}>{msg.text}</p>
              ))}
            </div>
            {/* <input type="text" value={this.userInput} onInput={this.handleInput} /> */}
            <button onClick={this.sendMessage}>Send</button>
          </div>
        </hr>
      </div>
      
    );
  }
}
/*

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

*/
