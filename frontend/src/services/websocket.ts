import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const connectWebSocket = (
  onMetrics: (metrics: any) => void, 
  onAlert: (alert: any) => void,
  onMatrix: (matrix: any) => void
) => {
  const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8080/ws-metrics'),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('Connected to WebSocket');
      
      client.subscribe('/topic/metrics', (message) => {
        if (message.body) {
          onMetrics(JSON.parse(message.body));
        }
      });

      client.subscribe('/topic/alerts', (message) => {
        if (message.body) {
          onAlert(JSON.parse(message.body));
        }
      });

      client.subscribe('/topic/global-matrix', (message) => {
        if (message.body) {
          onMatrix(JSON.parse(message.body));
        }
      });
    },
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },
  });

  client.activate();
  return client;
};
