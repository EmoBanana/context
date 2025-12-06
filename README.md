# CON//TEXT

## Inspiration
We all suffer from Optimism Bias, a cognitive blind spot that makes us believe we are too smart to fall for a scam. But the statistics tell a different story as billions of dollars are lost to social engineering every year. We cannot learn to spot a pattern by reading about it, we must experience it. Hence why I thought of a red-teaming themed game where we play the attacker.

## What it does
CON//TEXT is a social engineering sandbox that gamifies cybersecurity education. Instead of playing the victim, you play the attacker. Your mission is to "con" an advanced AI using the same psychological hooks, pressure tactics, and tools that real-world scammers use.

By reverse-engineering the attack, we force the human brain to recognize the patterns. The only way to build an immune system against scams is to first expose it to the virus in a controlled environment.

## How I built it
To create a realistic and infinitely replayable simulation, I built a modular Infinite Persona Engine by integrating several key technologies.

### 1. The Context Layer (Apify)
A scam is not believable without a backstory. I used Apify Actors to scrape real-time context from 25 unique data sources across the web, ranging from crypto forums and tech news sites to gardening blogs. This raw data provides the thematic "vibe" and potential vulnerabilities for the AI victim.

### 2. The Reasoning Engine (Gemini/Claude)
This is the brain of the operation. I ingest the scraped context into a large language model to generate a unique, hyper-realistic persona with specific psychological triggers.

### 3. The Game State & Logic (Convex)
Convex is the backend nervous system. It handles all real-time data synchronization, from chat message history to the player's inventory. Crucially, it tracks the player's success metrics (funds scammed and victims fooled) to generate a "Scam Wrapped" report.

### 4. The Speed Layer (Groq)
In social engineering, latency breaks immersion. I utilized the Groq ultra-fast inference engine to ensure that chat responses from the victim AI feel instant and natural, keeping the player engaged in the high-pressure scenario.

## Challenges we ran into
The biggest challenge was balancing realism with safety. I wanted the AI victim to be convincing, but not too good at generating harmful content.

I spent a significant amount of time on adversarial prompt engineering. I had to create a "Judge" agent (also powered by the LLM) that sits between the player and the victim. This Judge evaluates every player message in real-time. The Judge implements a function that decides if the scam attempt is successful, if the victim becomes suspicious, or if the message should be blocked entirely for safety violations.

Fine-tuning this threshold was difficult. Too strict, and the game is not fun. Too loose, and it loses its educational value. Finding that sweet spot taught me a deeper lesson about the practical challenges of aligning AI behavior in adversarial domains.

## Accomplishment that I'm proud of
Able to complete what I had in mind as a solo hacker.

## What we learned
Building CON//TEXT taught me that the most effective cybersecurity tool is not a firewall. It is a well-trained human mind.

By creating a "data flywheel" where players invent new scams, which are captured in Convex and used to train the AI to be harder to scam, I realized we are not just building a game. We are effectively crowdsourcing a massive dataset of novel social engineering attacks.

This project proved that we can use human creativity to train the next generation of defensive AI. As players get better at attacking, our models get better at defending, creating a positive feedback loop that ultimately makes both humans and AI safer.

---

## Getting Started

### Prerequisites

- Node.js
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd context-game
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the root directory. You will need API keys and configuration for the following services:
   - **Convex**: `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`
   - **Groq**: `GROQ_API_KEY`
   - **Apify**: `APIFY_API_TOKEN`
   - **Google Gemini / Claude**: Relevant API keys for the LLMs used.

4. **Run Convex:**

   Start the Convex backend development server:

   ```bash
   npm run convex:dev
   ```

5. **Run the Next.js development server:**

   In a separate terminal, start the frontend:

   ```bash
   npm run dev
   ```

6. **Open the application:**

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **Database & Backend**: [Convex](https://convex.dev)
- **AI Inference**: [Groq](https://groq.com)
- **Data Scraping**: [Apify](https://apify.com)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
