'use client'

import { Box, Button, Stack, TextField, IconButton } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useEffect, useRef, useState } from 'react';

const HEADSTARTER_PROMPT = `
Headstarter offers a 7-week software engineering fellowship designed to bridge the gap between academic learning and real-world experience. The program is focused on hands-on project development, including building five AI projects, participating in five weekend hackathons, and completing a final project with a goal of reaching 1,000 users or generating $1,000 in revenue. Fellows will also receive interview preparation, resume reviews, and feedback from professional software engineers. The fellowship is open to high school students, college students, and graduate students passionate about software engineering, aiming to build their skills and boost their resumes.

Applicants must be proficient in at least one programming language and commit 20 hours per week. The program includes AI coaching calls, mock interviews, and both virtual and in-person meetups. Weekly projects are submitted for peer feedback, and those who participate gain access to hackathons and team-based evaluations. In the final week, participants will demo their projects to software engineers, with the possibility of being contacted by companies for job opportunities. The fellowship is designed to prepare participants for successful careers in tech by providing practical experience, community support, and direct industry feedback.

When asked to output in bullet point format, each bullet point should be on a new line, like this:
- Bullet point 1
- Bullet point 2
- Bullet point 3
`;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState('');
  const [contextSent, setContextSent] = useState(false); // Track if context has been sent

  const sendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    setMessage('');

    // Only send the context with the first message
    let messagesToSend = messages;
    if (!contextSent) {
      messagesToSend = [
        { role: 'system', content: HEADSTARTER_PROMPT },
        ...messages,
      ];
      setContextSent(true);
    }

    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messagesToSend, { role: 'user', content: message }]),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let responseContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        responseContent += decoder.decode(value, { stream: true });
      }

      setMessages((messages) => {
        let lastMessage = messages[messages.length - 1];
        let otherMessages = messages.slice(0, messages.length - 1);
        return [
          ...otherMessages,
          { ...lastMessage, content: lastMessage.content + responseContent },
        ];
      });
    } catch (error) {
      console.error('Error:', error);
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="black"
      position="relative"
    >
      <Stack
        direction={'column'}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={'column'}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant'
                    ? 'primary.main'
                    : 'secondary.main'
                }
                color="white"
                borderRadius={16}
                p={3}
                // Render message content as HTML
                dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }}
              />
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction={'row'} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'white',
                },
                '&:hover fieldset': {
                  borderColor: 'white',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'white',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'white',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: 'white',
              },
              input: { color: 'white' }, // Makes the typed text white
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
      <Box position="absolute" bottom={16} right={16}>
        <IconButton
          color="inherit"
          href="https://github.com/simrangoel0/CustomerSupportAI"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitHubIcon sx={{ color: 'white', fontSize: 40 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
