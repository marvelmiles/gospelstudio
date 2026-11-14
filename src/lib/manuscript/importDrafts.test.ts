import { describe, expect, test } from "vitest";
import { draftsFromText, titleFromFileName } from "./importDrafts";
import { detectManuscriptFormat } from "./detectFormat";
import { extractManuscriptMetadata } from "./metadata";
import { splitManuscriptPieces } from "./pieces";

const text = (...lines: string[]): string => lines.join("\n");

const summarize = (source: string, fileName = "Songs.txt") =>
  draftsFromText(source, fileName).map(({ title, collection, format }) => ({
    title,
    collection,
    format,
  }));

const HOLY_HOLY_HOLY = [
  "1. Holy, holy, holy! Lord God Almighty!",
  "Early in the morning our song shall rise to Thee;",
  "Holy, holy, holy! merciful and mighty!",
  "God in three Persons, blessed Trinity!",
  "",
  "2. Holy, holy, holy! all the saints adore Thee,",
  "Casting down their golden crowns around the glassy sea;",
  "Cherubim and seraphim falling down before Thee,",
  "Which wert, and art, and evermore shalt be.",
];

const NOW_THANK_WE = [
  "1.   Now thank we all our God,",
  "     with heart and hands and voices,",
  "     who wondrous things has done,",
  "     in whom this world rejoices;",
  "",
  "2.   O may this bounteous God",
  "     through all our life be near us,",
  "     with ever joyful hearts",
  "     and blessed peace to cheer us;",
];

const BLESSED_ASSURANCE = [
  "1. Blessed assurance, Jesus is mine!",
  "O what a foretaste of glory divine!",
  "Heir of salvation, purchase of God,",
  "Born of His Spirit, washed in His blood.",
  "",
  "2. Perfect submission, perfect delight,",
  "Visions of rapture now burst on my sight;",
  "Angels descending bring from above",
  "Echoes of mercy, whispers of love.",
];

describe("finding every song in a file", () => {
  test("a restarted verse count under a capitalised heading starts the next hymn", () => {
    const source = text(
      ...HOLY_HOLY_HOLY,
      "",
      "NOW THANK WE OUR GOD",
      ...NOW_THANK_WE,
    );
    expect(summarize(source, "Hymns for Sunday.txt")).toEqual([
      { title: "Hymns for Sunday", collection: "Hymns", format: "song" },
      { title: "Now Thank We Our God", collection: "Hymns", format: "song" },
    ]);
  });

  test("song lines lose the indentation they had in the file", () => {
    const [hymn] = draftsFromText(text(...NOW_THANK_WE), "Hymn.txt");
    expect(hymn.body.split("\n").slice(0, 2)).toEqual([
      "1.   Now thank we all our God,",
      "with heart and hands and voices,",
    ]);
  });

  test("a lone title above verse one belongs to the hymn below it", () => {
    const source = text(
      "Jesus loves me, this I know",
      "For the Bible tells me so",
      "",
      "Blessed Assurance",
      "",
      ...BLESSED_ASSURANCE,
    );
    const drafts = draftsFromText(source, "Mixed.txt");
    expect(drafts.map((draft) => draft.title)).toEqual([
      "Mixed",
      "Blessed Assurance",
    ]);
    expect(drafts[0].body).not.toContain("Blessed Assurance");
  });

  test("capitalised headings split a book of choruses", () => {
    const source = text(
      "JESUS IS ALIVE",
      "Jesus is alive, Jesus is alive",
      "Everybody shout it, Jesus is alive",
      "",
      "HOLY IS THE LORD",
      "Holy is the Lord, God almighty",
      "We worship You",
      "",
      "THE JOY OF THE LORD",
      "The joy of the Lord is my strength",
    );
    expect(summarize(source)).toEqual([
      { title: "Jesus Is Alive", collection: "Praise", format: "song" },
      { title: "Holy Is The Lord", collection: "Worship", format: "song" },
      { title: "The Joy Of The Lord", collection: "Praise", format: "song" },
    ]);
  });

  test("a capitalised line that the song repeats stays a lyric", () => {
    const source = text(
      "Oh the blood of Jesus",
      "It washes white as snow",
      "",
      "GLORY TO HIS NAME",
      "Down at the cross",
      "",
      "Oh the blood of Jesus",
      "It sets the captive free",
      "",
      "GLORY TO HIS NAME",
    );
    expect(splitManuscriptPieces(source)).toHaveLength(1);
  });

  test("singing the first verse again is not a new song", () => {
    const source = text(
      ...BLESSED_ASSURANCE,
      "",
      BLESSED_ASSURANCE[0],
      ...BLESSED_ASSURANCE.slice(1, 4),
    );
    expect(splitManuscriptPieces(source)).toHaveLength(1);
  });

  test("declared headings name, file and split each piece", () => {
    const source = text(
      "HYMN: Abide With Me",
      "Abide with me; fast falls the eventide;",
      "The darkness deepens; Lord, with me abide.",
      "",
      "SONG: Way Maker",
      "You are here, moving in our midst",
      "I worship You, I worship You",
    );
    expect(summarize(source)).toEqual([
      { title: "Abide With Me", collection: "Hymns", format: "song" },
      { title: "Way Maker", collection: "Worship", format: "song" },
    ]);
  });

  test("separator lines split untitled songs that then share the file name", () => {
    const source = text(
      "Give thanks with a grateful heart",
      "Give thanks to the Holy One",
      "==========",
      "We bring the sacrifice of praise",
      "Into the house of the Lord",
    );
    expect(
      draftsFromText(source, "Sunday_choruses.txt").map((draft) => draft.title),
    ).toEqual(["Sunday choruses", "Sunday choruses (2)"]);
  });

  test("one song stays one manuscript", () => {
    const source = text(
      "Ascribe greatness to our God, the Rock",
      "His work is perfect",
      "And all His ways are just",
      "(Repeat)",
      "",
      "",
      "A God of faithfulness without injustice,",
      "Good and upright is He,",
    );
    const drafts = draftsFromText(source, "A God of faithfulness.txt");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].title).toBe("A God of faithfulness");
    expect(drafts[0].collection).toBe("Worship");
    expect(drafts[0].slides[0].notes).toContain("Repeat");
  });
});

describe("sermons", () => {
  const SERMONS = text(
    "Walking In Faith",
    "Text: Hebrews 11:1",
    "Preacher: Pastor Ada",
    "",
    "Faith is the substance of things hoped for, the evidence of things not seen. Every believer is called to live by faith and not by sight, trusting God in every season.",
    "",
    "THE NATURE OF FAITH",
    "",
    "Faith begins when we hear the word of God and choose to believe it even when circumstances say otherwise. It grows as we act on what we have heard.",
    "",
    "The Power Of Prayer",
    "Text: James 5:16",
    "Preacher: Pastor Sam",
    "",
    "The effectual fervent prayer of a righteous man availeth much. Prayer is not a ritual but a relationship with the Father who hears.",
  );

  test("each titled sermon with its own preamble becomes a manuscript", () => {
    const drafts = draftsFromText(SERMONS, "Messages.docx");
    expect(
      drafts.map(({ title, author, collection, format }) => ({
        title,
        author,
        collection,
        format,
      })),
    ).toEqual([
      {
        title: "Walking In Faith",
        author: "Pastor Ada",
        collection: "Sermons",
        format: "sermon",
      },
      {
        title: "The Power Of Prayer",
        author: "Pastor Sam",
        collection: "Sermons",
        format: "sermon",
      },
    ]);
    expect(drafts[0].body).toContain("THE NATURE OF FAITH");
  });

  test("long paragraphs read as a sermon and short lines as a song", () => {
    expect(detectManuscriptFormat(SERMONS.split("\n"))).toBe("sermon");
    expect(detectManuscriptFormat(NOW_THANK_WE)).toBe("song");
  });
});

describe("categories", () => {
  test("performer cues file a song under choir ministration", () => {
    const source = text(
      "Soloist: Who is like unto Thee",
      "Choir: O Lord among the gods",
      "Soloist: Glorious in holiness",
      "Choir: Fearful in praises",
    );
    expect(draftsFromText(source, "Anthem.txt")[0].collection).toBe(
      "Choir Ministration",
    );
  });

  test("seasonal words file a song under special songs", () => {
    const carol = text(
      "A king is born this day in Bethlehem",
      "He is in the manger now",
      "Humbly come and humbly bow",
    );
    expect(draftsFromText(carol, "Carol.txt")[0].collection).toBe(
      "Special Songs",
    );
    expect(
      draftsFromText(
        text("Glory to the newborn King", "Peace on earth"),
        "Christmas medley.txt",
      )[0].collection,
    ).toBe("Special Songs");
  });

  test("Yoruba thanksgiving words read as praise", () => {
    expect(
      draftsFromText(
        text("A m'ope, A mu'yin wa o", "Gb'ope, Gb'ope Sa"),
        "A m'ope.txt",
      )[0].collection,
    ).toBe("Praise");
  });
});

describe("titles", () => {
  test("a heading directly above verse one is the title", () => {
    expect(
      extractManuscriptMetadata(["NOW THANK WE ALL OUR GOD", ...NOW_THANK_WE])
        .title,
    ).toBe("Now Thank We All Our God");
  });

  test("a single shouted word above a lyric is kept as a lyric", () => {
    expect(
      extractManuscriptMetadata(["HALLELUYAH", "Praise the Lord, O my soul"])
        .title,
    ).toBeNull();
    expect(
      extractManuscriptMetadata([
        "Amazing grace, how sweet the sound",
        "That saved a wretch like me",
      ]).title,
    ).toBeNull();
  });

  test("file names become readable titles", () => {
    expect(titleFromFileName("Choruses/Sunday__service_songs.docx")).toBe(
      "Sunday service songs",
    );
  });
});
