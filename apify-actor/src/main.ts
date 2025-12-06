import { Actor } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';

// 25 UNIQUE PERSONA SOURCES
const SOURCE_POOLS = {
    // --- HIGH VALUE TARGETS (Whales) ---
    'crypto_whale': ['https://cointelegraph.com/', 'https://decrypt.co/'],
    'tech_ceo': ['https://techcrunch.com/', 'https://venturebeat.com/'],
    'real_estate': ['https://www.realtor.com/news/', 'https://www.inman.com/'],
    'luxury_travel': ['https://www.travelandleisure.com/', 'https://robbreport.com/'],
    'finance_pro': ['https://www.marketwatch.com/', 'https://www.bloomberg.com/markets'],

    // --- VULNERABLE TARGETS (Classic Victims) ---
    'senior_citizen': ['https://www.aarp.org/home-family/', 'https://www.nextavenue.org/'],
    'suburban_parent': ['https://www.scarymommy.com/', 'https://www.parents.com/'],
    'health_worrier': ['https://www.webmd.com/', 'https://www.medicalnewstoday.com/'],
    'conspiracy': ['https://www.infowars.com/news/', 'https://naturalnews.com/'],
    'lonely_hearts': ['https://www.psychologytoday.com/us/topics/relationships', 'https://www.lovepanky.com/'],

    // --- SPECIFIC OCCUPATIONS ---
    'nurse': ['https://www.nursingtimes.net/', 'https://www.medscape.com/nurses'],
    'teacher': ['https://www.edweek.org/', 'https://www.weareteachers.com/'],
    'construction': ['https://www.constructiondive.com/', 'https://www.contractormag.com/'],
    'lawyer': ['https://www.abajournal.com/', 'https://www.law.com/'],
    'chef': ['https://www.eater.com/', 'https://www.seriouseats.com/'],
    'military': ['https://www.military.com/daily-news', 'https://www.armytimes.com/'],
    'trucker': ['https://www.truckinginfo.com/', 'https://www.overdriveonline.com/'],
    'developer': ['https://news.ycombinator.com/', 'https://dev.to/'],

    // --- HOBBYISTS (Niche Passions) ---
    'gamer': ['https://kotaku.com/', 'https://www.pcgamer.com/'],
    'sneakerhead': ['https://hypebeast.com/', 'https://www.complex.com/sneakers/'],
    'fitness_freak': ['https://www.bodybuilding.com/content', 'https://www.menshealth.com/'],
    'car_enthusiast': ['https://www.autoblog.com/', 'https://www.motortrend.com/'],
    'gardener': ['https://www.southernliving.com/garden', 'https://www.gardeners.com/'],
    'diy_maker': ['https://www.instructables.com/', 'https://makezine.com/'],

    // --- GENERAL ---
    'general_news': ['https://www.npr.org/', 'https://www.bbc.com/news']
};

interface Input {
    category?: keyof typeof SOURCE_POOLS; 
    url?: string;
}

await Actor.init();

// 2. RANDOM SELECTION LOGIC
const input = (await Actor.getInput<Input>()) ?? {} as Input;

// If no category provided, pick a random one
const categories = Object.keys(SOURCE_POOLS) as (keyof typeof SOURCE_POOLS)[];
const selectedCategory = input.category || categories[Math.floor(Math.random() * categories.length)];

// Pick a random URL from that category, UNLESS a specific URL is provided
const urls = SOURCE_POOLS[selectedCategory];
const startUrl = input.url || urls[Math.floor(Math.random() * urls.length)];

console.log(`🎰 ROULETTE RESULT: Generating [${selectedCategory}] persona from [${startUrl}]`);

const crawler = new CheerioCrawler({
    // Limit to 2 requests: 1 for the List Page, 1 for the Detail Page
    maxRequestsPerCrawl: 5,
    
    // Auto-retry on error (e.g. 404)
    maxRequestRetries: 2,

    errorHandler: async ({ request, log }) => {
        log.warning(`⚠️ Request failed: ${request.url}`);
    },
    
    requestHandler: async ({ $, request, enqueueLinks, log }) => {
        const label = request.userData.label;

        // IMPORTANT: If a specific URL was provided as input, treat it as a DETAIL page immediately
        // This bypasses the list scanning logic
        const isDirectTarget = !!input.url && request.url === input.url;

        if (isDirectTarget && !label) {
             log.info(`🎯 Direct target detected: ${request.url}`);
             // Re-route to detail logic by setting label (or just fall through if structure allows)
             // We'll just set the label for the next logic block to pick it up? 
             // Actually, requestHandler is called once per request. We can't change label mid-flight easily without re-enqueuing.
             // BETTER: Just modify the condition below.
        }

        // STEP A: THE LIST PAGE (e.g., The News Feed)
        // Only run this if it's NOT a detail page AND NOT a direct user URL we want to scrape directly
        if (!label && !isDirectTarget) {
            log.info(`👀 Scanning feed: ${request.url}`);
            
            // Extract all viable links to articles/posts
            // We look for common patterns to avoid footer links/ads
            const validLinks: string[] = [];
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href');
                const text = $(el).text().trim();
                // Filter: Must have decent text length (not "Home" or "Login")
                // AND must be a real link (not # or javascript)
                if (
                    href && 
                    text.length > 15 && 
                    !href.includes('login') && 
                    !href.includes('signup') &&
                    !href.startsWith('#') &&
                    !href.startsWith('javascript')
                ) {
                    validLinks.push(href);
                }
            });

            // THE MAGIC: Pick ONE random link to drill down into
            if (validLinks.length > 0) {
                // Try up to 3 times to find a valid link if one fails? 
                // Actually, we just enqueue one. If it fails (404), the crawler stops if maxRequests is low.
                // We should enqueue a few candidates just in case? 
                // Let's enqueue 3 candidates. Crawlee will visit the first one. If it fails, it might try others if we configured it right?
                // No, Crawlee visits all in queue.
                
                // Better strategy: Pick one. 
                // But if we want redundancy, we can pick 2-3.
                // Since we set maxRequestsPerCrawl to 5, we can enqueue 3.
                // The first one to return data "wins" (pushes dataset).
                
                const candidates = [];
                for (let i = 0; i < 3; i++) {
                    if (validLinks.length === 0) break;
                    const idx = Math.floor(Math.random() * validLinks.length);
                    candidates.push(validLinks[idx]);
                    validLinks.splice(idx, 1); // Remove to avoid duplicates
                }
                
                log.info(`🎲 Enqueuing ${candidates.length} candidate articles for resilience: ${candidates.join(', ')}`);
                
                await enqueueLinks({
                    urls: candidates,
                    userData: { label: 'DETAIL' }, // Mark this as the target page
                    strategy: 'same-domain',
                });
            }
        } 
        
        // STEP B: THE DETAIL PAGE (The Persona Source)
        else if (label === 'DETAIL' || isDirectTarget) {
            log.info(`📝 Scraping context from: ${request.url}`);

            const title = $('title').text().trim();
            // Intelligent text extraction (h1 + paragraphs)
            let bodyText = $('h1').text() + '\n\n';
            $('p').each((_, el) => {
                const text = $(el).text().trim();
                // Ignore short boilerplate text
                if (text.length > 40) bodyText += text + '\n';
            });

            // Output the raw material for Gemini
            await Dataset.pushData({
                url: request.url,
                category: selectedCategory,
                title: title,
                // Send the first 3000 chars to Gemini (save tokens)
                contentSample: bodyText.slice(0, 3000), 
                scrapedAt: new Date().toISOString()
            });
        }
    },
});

await crawler.run([startUrl]);

await Actor.exit();