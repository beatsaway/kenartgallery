// Artwork descriptions for Gallery 2020 — edit titles and text here.
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
    "**Piece 10**\nAdd your description for this artwork.",
    "**Piece 11**\nAdd your description for this artwork.",
    "**Piece 12**\nAdd your description for this artwork.",
    "**Piece 13**\nAdd your description for this artwork.",
    "**Piece 14**\nAdd your description for this artwork.",
    "**Piece 15**\nAdd your description for this artwork.",
    "**Piece 16**\nAdd your description for this artwork.",
    "**Piece 17**\nAdd your description for this artwork.",
    "**Piece 18**\nAdd your description for this artwork.",
    "**Piece 19**\nAdd your description for this artwork.",
    "**Piece 20**\nAdd your description for this artwork.",
    "**Piece 21**\nAdd your description for this artwork.",
    "**Piece 22**\nAdd your description for this artwork.",
    "**Piece 23**\nAdd your description for this artwork.",
    "**Piece 24**\nAdd your description for this artwork.",
    "**Piece 25**\nAdd your description for this artwork.",
    "**Piece 26**\nAdd your description for this artwork.",
    "**Piece 27**\nAdd your description for this artwork.",
    "**Piece 28**\nAdd your description for this artwork.",
    "**Piece 29**\nAdd your description for this artwork.",
    "**Piece 30**\nAdd your description for this artwork.",
    "**Piece 31**\nAdd your description for this artwork.",
    "**Piece 32**\nAdd your description for this artwork.",
    "**Piece 33**\nAdd your description for this artwork.",
    "**Piece 34**\nAdd your description for this artwork.",
    "**Piece 35**\nAdd your description for this artwork.",
    "**Piece 36**\nAdd your description for this artwork.",
    "**Piece 37**\nAdd your description for this artwork.",
    "**Piece 38**\nAdd your description for this artwork.",
    "**Piece 39**\nAdd your description for this artwork.",
    "**Piece 40**\nAdd your description for this artwork.",
    "**Piece 41**\nAdd your description for this artwork.",
    "**Piece 42**\nAdd your description for this artwork.",
    "**Piece 43**\nAdd your description for this artwork.",
    "**Piece 44**\nAdd your description for this artwork.",
    "**Piece 45**\nAdd your description for this artwork."
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
