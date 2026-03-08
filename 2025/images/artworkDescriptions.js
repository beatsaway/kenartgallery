// Artwork descriptions
const artworkDescriptions = [
    "**Patterns Emerge**\nWatch how repeated simple marks grow into something complex, just as billions of simple brain cells create our thoughts and consciousness.",
    "**Space Between**\nThe red lines dance with the white paper, showing how emptiness shapes form. What's not drawn matters as much as what is—like pauses in a conversation.",
    "**Finding Meaning**\nYour brain naturally hunts for patterns everywhere. These unplanned marks reveal how you're always creating stories from random information—your mind is constantly making art.",
    "**Nature's Mathematics**\nThese branching patterns follow the same hidden rules as tree limbs and river deltas. Your hand instinctively recreates nature's secret geometry.",
    "**Letting Go**\nThis artwork wasn't planned—it emerged when control was surrendered. What unexpected beauty might appear in your life when you stop forcing outcomes?",
    "**Creative Edge**\nNeither perfect order nor complete chaos makes interesting art—it's the tension between them. This piece lives at that fertile boundary where creativity thrives.",
    "**Beautiful Accidents**\nHere, intention meets chance. The unexpected marks aren't mistakes but collaborators, creating something neither could achieve alone.",
    "**Organized Chaos**\nAs lines multiply, disorder increases, yet structure appears. This paradox mirrors everything from weather patterns to stock markets—complexity breeding new order.",
    "**More Than the Sum**\nSingle marks are simple, but together they create exponential complexity. Like ants building cathedrals or neurons creating thought, basic units combine to form something magnificently beyond their individual capacity.",
    "**Effortless Action**\nThese marks embody the Taoist principle of 'doing without doing'—not forcing results but allowing them to unfold naturally. When have your best outcomes come from letting go rather than pushing harder?",
    "**External Thinking**\nThese marks function as thinking-on-paper, extending your brain onto the page. Your environment becomes part of your creative processing.",
    "**Response Chains**\nEach mark responds to what came before, creating a visual conversation. Life similarly unfolds through chains of response rather than isolated actions.",
    "**Subtle Power**\nThe red lines whisper rather than shout, showing how powerful subtlety can be. What quiet forces are shaping your perceptions right now?",
    "**Natural Order**\nWithout a master plan, these marks self-organize into coherent forms—just like flocks of birds, market economies, and internet communities find structure without central control.",
    "**Decision Trees**\nEach mark branches into new possibilities, just as small choices open unexpected pathways in life. This artwork maps the geography of potential.",
    "**Collective Intelligence**\nBeauty emerges here not from one brilliant stroke but from many simple decisions across time. What problems in your life might benefit from this distributed approach?",
    "**Between Worlds**\nThese forms exist between planning and chance—in that fertile in-between space where preparation meets opportunity and magic happens.",
    "**Mind Liberation**\nRepeating the same mark frees your conscious mind from the physical action. This desensitization unlocks flow state—showing how repetition isn't boring but can be the doorway to creative freedom.",
    "**Beyond Self**\nThis artwork isn't about expressing personality but capturing universal process. What becomes possible when we create from beyond our ego boundaries?"
];

function parseArtworkDescription(index) {
    const description = artworkDescriptions[index];
    if (!description) return { title: 'Unknown Artwork', description: 'No description available.' };
    
    // Extract title from markdown format (**Title**)
    const titleMatch = description.match(/\*\*(.*?)\*\*/);
    const title = titleMatch ? titleMatch[1] : 'Untitled';
    
    // Get description (everything after the title)
    const desc = description.split('\n')[1] || 'No description available.';
    
    return {
        title: title,
        description: desc
    };
} 