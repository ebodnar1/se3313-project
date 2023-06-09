const words = [
    "grass",
    "library",
    "downtown",
    "smile",
    "scarecrow",
    "calculator",
    "cherry",
    "breakfast",
    "government",
    "school",
    "baby",
    "goldfish",
    "tongue",
    "carriage",
    "paper",
    "corn",
    "rock",
    "airport",
    "grandfather",
    "worm",
    "sidewalk",
    "flower",
    "turkey",
    "curtain",
    "scissors",
    "pencil",
    "airplane",
    "cemetery",
    "canvas",
    "thunder",
    "geese",
    "river",
    "animal",
    "apple",
    "magic",
    "trousers",
    "tree",
    "machine",
    "cheese",
    "vase",
    "afternoon",
    "umbrella",
    "jelly",
    "toothbrush",
    "lawyer",
    "baseball",
    "ocean",
    "ladybug",
    "mailbox",
    "jellyfish",
    "tiger",
    "eggnog",
    "copper"
]

const getRandomWord = () => {
    return words[Math.floor(Math.random() * words.length)];
}

export {getRandomWord};