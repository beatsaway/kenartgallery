// Artwork descriptions for Gallery 2016 — edit titles and text here.
// Format: "**Title**\nDescription line."
const artworkDescriptions = [
    "**Piece 1**\nAdd your description for this artwork.",
    "**Piece 2**\nAdd your description for this artwork.",
    "**Piece 3**\nAdd your description for this artwork.",
    "**Piece 4**\nAdd your description for this artwork.",
    "**Piece 5**\nAdd your description for this artwork.",
    "**Piece 6**\nAdd your description for this artwork.",
    "**Piece 7**\nAdd your description for this artwork.",
    "**Piece 8**\nAdd your description for this artwork.",
    "**Piece 9**\nAdd your description for this artwork.",
    "**Piece 10**\nAdd your description for this artwork."
];

function parseArtworkDescription(index) {
    const description = artworkDescriptions[index];
    if (!description) return { title: 'Unknown Artwork', description: 'No description available.' };

    const titleMatch = description.match(/\*\*(.*?)\*\*/);
    const title = titleMatch ? titleMatch[1] : 'Untitled';
    const desc = description.split('\n')[1] || 'No description available.';

    return {
        title: title,
        description: desc
    };
}
