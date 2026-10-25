import { Song, EventSetlist } from '../types';

export const SEED_SONGS: Song[] = [
  {
    id: 'song-goodness-of-god',
    title: 'Goodness of God',
    artist: 'Bethel Music / Jenn Johnson',
    defaultKey: 'G',
    tempo: 68,
    timeSignature: '4/4',
    categories: ['Worship', 'English'],
    ccli: '7117726',
    notes: 'Dynamic build into Chorus 2; soft acoustic into Bridge 1.',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
    lyricsWithChords: `[Intro]
[G] / / / | [C] / / / | [G] / / / | [C] / / /

[Verse 1]
[G]I love You, Lord
For Your [C]mercy never [G]fails me
[D/F#]All my [Em]days, I've been [C]held in Your [D]hands
From the moment that I [Em]wake up
Until I lay [C]my [G]head
[D/F#]Oh, I will [Em]sing of the [C]goodness [D]of [G]God

[Chorus]
'Cause [C]all my life You have been [G]faithful
And [C]all my life You have been [G]so, so [D]good
With [C]every breath that I am [G]able [D/F#] [Em]
Oh, I will [C]sing of the [D]goodness of [G]God

[Verse 2]
[G]I love Your voice
You have [C]led me through the [G]fire
In the [D/F#]darkest [Em]night
You are [C]close like no [D]other
I've known You as a [Em]Father
I've known You as a [C]Friend [G]
And [D/F#]I have [Em]lived in the [C]goodness [D]of [G]God

[Bridge]
[G/B]Your goodness is [C]running after, it's [D]running after [G]me
[G/B]Your goodness is [C]running after, it's [D]running after [G]me
With my [G/B]life laid down, I'm sur[C]rendered now
I [D]give You every[Em]thing
'Cause Your [G/B]goodness is [C]running after, it's [D]running after [G]me

[Ending]
Oh, I will [C]sing of the [D]goodness of [G]God`
  },
  {
    id: 'song-salamat-salamat',
    title: 'Salamat Salamat',
    artist: 'Malayang Pilipino Music',
    defaultKey: 'G',
    tempo: 72,
    timeSignature: '4/4',
    categories: ['Worship', 'Tagalog', 'Praise'],
    notes: 'Tagalog Classic Worship. Highlight during Thanksgiving and Communion.',
    createdAt: '2026-01-12T08:00:00Z',
    updatedAt: '2026-10-21T09:30:00Z',
    lyricsWithChords: `[Intro]
[G] / [Bm7] / | [C] / [D] / | [G] / [Bm7] / | [C] / [D] /

[Verse 1]
Kung [G]aking pagmasdan ang kalawakan
Hindi ko maunawa[C]an
Ang Iyong dahilan kung [Am]bakit ako'y
Iyong minahal at [D]inalagaan

[Verse 2]
[G]Buhay ko'y binago Mong lubusan
Binigyan Mo ng pag-asa't [C]kapayapaan
Wala nang ibang kailangan [Am]pa
Hesus Ikaw lang sapat [D]na

[Chorus]
Sa[G]lamat, salamat [Bm7]sa Iyong pag-ibig
[C]Biyaya Mo'y walang [D]katapusan
Sa[G]lamat, salamat [Bm7]sa Iyong pagpapala
[C]Wagas Mong pag-ibig sa [D]buhay ko
Sa[G]lamat Hesus

[Bridge]
Di [Em]magbabago ang pag-ibig [Bm7]Mo
Magpakaylan[C]man Pangino[D]on
Puso [Em]ko'y sa 'Yo lamang ia[Bm7]alay
Purihin Ka [C]sa habang bu[D]hay`
  },
  {
    id: 'song-way-maker',
    title: 'Way Maker',
    artist: 'Sinach / Leeland',
    defaultKey: 'G',
    tempo: 68,
    timeSignature: '4/4',
    categories: ['Worship', 'Praise', 'English'],
    ccli: '7115744',
    notes: 'Great build up; Repeat bridge dynamic prayer moment.',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-10-22T14:10:00Z',
    lyricsWithChords: `[Intro]
[C] / / / | [G] / / / | [D] / / / | [Em] / / /

[Verse 1]
You are [C]here, moving in our [G]midst
I worship [D]You, I worship [Em]You
You are [C]here, working in this [G]place
I worship [D]You, I worship [Em]You

[Chorus]
[C]Way maker, miracle worker, [G]promise keeper
Light in the darkness, [D]my God, that is who You [Em]are
[C]Way maker, miracle worker, [G]promise keeper
Light in the darkness, [D]my God, that is who You [Em]are

[Verse 2]
You are [C]here, touching every [G]heart
I worship [D]You, I worship [Em]You
You are [C]here, healing every [G]heart
I worship [D]You, I worship [Em]You

[Bridge]
Even when I [C]don't see it, You're working
Even when I [G]don't feel it, You're working
You never [D]stop, You never stop working
You never [Em]stop, You never stop working`
  },
  {
    id: 'song-dakilang-katapatan',
    title: 'Dakilang Katapatan',
    artist: 'Papuri / Arnel De Pano',
    defaultKey: 'C',
    tempo: 65,
    timeSignature: '4/4',
    categories: ['Worship', 'Tagalog', 'Hymn'],
    notes: 'Filipino timeless anthem of God\'s great faithfulness.',
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-10-23T11:00:00Z',
    lyricsWithChords: `[Intro]
[C] / [G/B] / | [Am] / [C/G] / | [F] / [G] / | [C] / / /

[Verse 1]
Sadyang kay [C]buti ng ating Pangino[Em]on
Magtatapat [F]sa habang pana[G]hon
Maging sa [Em]kabila ng ating pagkuku[Am]lang
Biyaya [Dm]Niya'y patuloy na laa[G]n

[Verse 2]
Katulad [C]ng pagsikat ng gintong [Em]araw
Patuloy [F]Siyang nagbibigay tangla[G]w
Kaya sa [Em]puso ko't damdamin
Katapatan [Am]Niya'y aking pupurihin
[Dm]Aawitin magpaka[G]ilanman

[Chorus]
Da[C]kilang katapa[Em]tan
Pangino[F]on Iyong kaawa[G]an
Magpakailan[Em]man ay manana[Am]tili
Walang ha[Dm]nggang pag-ibig [G]Mo
Dakilang [C]Diyos, da[Em]kila Ka
Sa [F]buhay ko't kalul[G]wa
Dakila [Em]ang Iyong katapa[Am]tan
Pangino[Dm]on, mag[G]pakailan[C]man`
  },
  {
    id: 'song-10000-reasons',
    title: '10,000 Reasons (Bless the Lord)',
    artist: 'Matt Redman',
    defaultKey: 'G',
    tempo: 73,
    timeSignature: '4/4',
    categories: ['Praise', 'Worship', 'English'],
    ccli: '6016351',
    notes: 'Opening chorus with warm pads or acoustic strum.',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-10-20T12:00:00Z',
    lyricsWithChords: `[Chorus]
Bless the [C]Lord, O my [G]soul, [D/F#]O my [Em]soul
[C]Worship His [G]holy [D]name
Sing like [C]never be[Em]fore, [C] [D]O my [Em]soul
I'll [C]worship Your [D]holy [G]name

[Verse 1]
The [C]sun comes [G]up, it's a [D]new day [Em]dawning
[C]It's time to [G]sing Your [D]song a[Em]gain
What[C]ever may [G]pass and what[D]ever lies be[Em]fore me
[C2]Let me be [G]singing when the [D]evening [G]comes

[Verse 2]
You're [C]rich in [G]love and You're [D]slow to [Em]anger
Your [C]name is [G]great and Your [D]heart is [Em]kind
For [C]all Your [G]goodness I will [D]keep on [Em]singing
[C2]Ten thousand [G]reasons for my [D]heart to [G]find

[Verse 3]
And [C]on that [G]day when my [D]strength is [Em]failing
The [C]end draws [G]near and my [D]time has [Em]come
[C]Still my [G]soul will sing Your [D]praise un[Em]ending
[C2]Ten thousand [G]years and then for[D]ever[G]more`
  },
  {
    id: 'song-tanging-ikaw',
    title: 'Tanging Ikaw',
    artist: 'Musikatha',
    defaultKey: 'D',
    tempo: 70,
    timeSignature: '4/4',
    categories: ['Worship', 'Tagalog'],
    notes: 'Sweet acoustic worship song. Intimate vocal reflection.',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-10-22T08:30:00Z',
    lyricsWithChords: `[Intro]
[D] / [G] / | [D/F#] / [A] /

[Verse 1]
[D]Tanging Ikaw lamang [A/C#]O Diyos
Ang [Bm]siyang ligaya ng aking [F#m]puso
Sa [G]piling Mo'y may kaganapa[D/F#]n
Kagalak[Em]ang walang hangga[A]n

[Verse 2]
[D]Tanging Ikaw lamang [A/C#]O Diyos
Ang [Bm]siyang lakas sa bawat [F#m]araw
Sa [G]buhay ko'y Ikaw ang ha[D/F#]ri
Pupuri[Em]hin Ka tuwi[A]na

[Chorus]
[D]Sambahin Ka't paranga[A/C#]lan
O [Bm]Diyos ng aking kaligtasa[F#m]n
Ang [G]buhay ko'y ia[D/F#]alay
Sa [Em]Iyo lamang Pangino[A]on
O [D]Hesus`
  },
  {
    id: 'song-what-a-beautiful-name',
    title: 'What A Beautiful Name',
    artist: 'Hillsong Worship',
    defaultKey: 'D',
    tempo: 68,
    timeSignature: '4/4',
    categories: ['Worship', 'English'],
    ccli: '7068424',
    notes: 'Power bridge with drums full hit; keys pad swelling.',
    createdAt: '2026-04-01T12:00:00Z',
    updatedAt: '2026-10-23T15:00:00Z',
    lyricsWithChords: `[Verse 1]
You were the [D]Word at the beginning
One with [G]God the Lord Most [Bm]High [A]
Your hidden [Bm]glory in cre[A/C#]ation
Now re[D]vealed in You our [G]Christ

[Chorus 1]
What a beautiful Name it [D]is
What a beautiful Name it [A]is
The Name of [Bm]Jesus Christ [A]my [G]King
What a beautiful Name it [D/F#]is
Nothing compares to [A]this
What a beautiful Name it [Bm]is
The [A]Name of [G]Jesus

[Verse 2]
You didn't [D]want heaven without us
So Jesus, [G]You brought heaven [Bm]down [A]
My sin was [Bm]great, Your love was [A/C#]greater
What could [D]separate us [G]now?

[Bridge]
Death could not [G]hold You, the veil tore be[A]fore You
You silence the [Bm]boast of sin and [F#m]grave
The heavens are [G]roaring the praise of Your [A]glory
For You are [Bm]raised to life a[A]gain

[Bridge 2]
You have no [G]rival, You have no [A]equal
Now and for[Bm]ever, God, You [F#m]reign
Yours is the [G]Kingdom, Yours is the [A]glory
Yours is the [Bm]Name above all [A]names`
  },
  {
    id: 'song-banal-mong-tahanan',
    title: 'Banal Mong Tahanan',
    artist: 'Musikatha',
    defaultKey: 'E',
    tempo: 66,
    timeSignature: '4/4',
    categories: ['Worship', 'Tagalog', 'Communion', 'Reflection'],
    notes: 'Solemn prayer of surrender and consecrated worship.',
    createdAt: '2026-04-15T09:00:00Z',
    updatedAt: '2026-10-23T16:00:00Z',
    lyricsWithChords: `[Intro]
[E] / [B/D#] / | [C#m] / [B] / | [A] / [B] / | [E] / / /

[Verse 1]
Ang [E]puso ko'y [B/D#]dinudulog sa [C#m]Iyo [B]
Nanganga[A]rap na [F#m]mapalapit sa [B]Iyo
Maa[E]ring alisin [B/D#]ang lahat sa [C#m]akin [B]
Huwag [A]lang ang banal Mong [B]presensya

[Chorus]
Gawin [E]Mong banal Mong taha[B/D#]nan
Ang [C#m]buhay ko Pangino[G#m]on
Tahanan [A]ng Iyong kapayapa[E/G#]an
At Iyong [F#m]katuwira[B]n
Punuin [E]Mo ng pagsam[B/D#]ba
Ang [C#m]puso ko sa tuwi[G#m]na
Gawing [A]dambana ng Iyong [B]kalualhatian
Pangino[E]on`
  },
  {
    id: 'song-praise',
    title: 'Praise',
    artist: 'Elevation Worship / Brandon Lake',
    defaultKey: 'G',
    tempo: 128,
    timeSignature: '4/4',
    categories: ['Praise', 'Fast', 'English'],
    ccli: '7205996',
    notes: 'High energy praise opener! Driving 4-on-the-floor kick.',
    createdAt: '2026-05-01T14:00:00Z',
    updatedAt: '2026-10-24T02:00:00Z',
    lyricsWithChords: `[Intro]
[G] / / / | [C] / / / | [Em] / / / | [D] / / /

[Verse 1]
Let everything that has [G]breath praise the Lord
Let everything that has [C]breath praise the Lord
Praise the [Em]Lord in the sanctuary
Praise the [D]Lord in the mighty heavens

[Chorus]
I'll praise in the [G]valley, praise on the mountain
Praise in the [C]shadow, praise in the light
I'll praise when I'm [Em]broken, praise when I'm whole
I'll praise with my [D]spirit, body and soul
Praise the [G]Lord!

[Bridge]
My praise is a [G]weapon, it clears out the room
My praise is an [C]anchor when oceans consume
My praise is an [Em]offering, my praise is a shout
I won't let a [D]stone take my place now!`
  }
];

export const INITIAL_SETLISTS: EventSetlist[] = [
  {
    id: 'setlist-sunday-service',
    title: 'Sunday Worship Service - Praise & Word',
    date: '2026-11-01',
    time: '10:00 AM',
    leaderId: 'user-leader-1',
    leaderName: 'Ptr. David Chen',
    theme: 'Unfailing Faithfulness (Lamentations 3:22-23)',
    notes: 'Opening call to worship -> Upbeat Praise -> Solemn Worship -> Pastor Message.',
    createdAt: '2026-10-20T08:00:00Z',
    items: [
      {
        id: 'item-1',
        songId: 'song-praise',
        songTitle: 'Praise',
        artist: 'Elevation Worship / Brandon Lake',
        keyOverride: 'G',
        leadSinger: 'Marcus & Joy',
        notes: 'High energy kickoff; encourage congregation to stand!',
        durationMinutes: 5
      },
      {
        id: 'item-2',
        songId: 'song-salamat-salamat',
        songTitle: 'Salamat Salamat',
        artist: 'Malayang Pilipino Music',
        keyOverride: 'G',
        leadSinger: 'Sarah Mae',
        notes: 'Smooth transition from Praise. Congregation sing-along.',
        durationMinutes: 6
      },
      {
        id: 'item-3',
        songId: 'song-goodness-of-god',
        songTitle: 'Goodness of God',
        artist: 'Bethel Music / Jenn Johnson',
        keyOverride: 'Ab',
        leadSinger: 'Ptr. David Chen',
        notes: 'Key override to Ab for leader comfort; soft strings entry.',
        durationMinutes: 7
      },
      {
        id: 'item-4',
        songId: 'song-dakilang-katapatan',
        songTitle: 'Dakilang Katapatan',
        artist: 'Papuri / Arnel De Pano',
        keyOverride: 'C',
        leadSinger: 'Ensemble Choir',
        notes: 'Closing worship anthem before Pastoral Prayer.',
        durationMinutes: 6
      }
    ]
  },
  {
    id: 'setlist-youth-revival',
    title: 'Youth Revival & Encounter Night',
    date: '2026-11-06',
    time: '07:30 PM',
    leaderId: 'user-leader-1',
    leaderName: 'Joshua Reyes',
    theme: 'Ignited for the Harvest',
    notes: 'Full electric band, extended altar call ministry.',
    createdAt: '2026-10-22T10:00:00Z',
    items: [
      {
        id: 'item-y1',
        songId: 'song-praise',
        songTitle: 'Praise',
        artist: 'Elevation Worship / Brandon Lake',
        keyOverride: 'A',
        leadSinger: 'Joshua Reyes',
        notes: 'Explosive start!',
        durationMinutes: 5
      },
      {
        id: 'item-y2',
        songId: 'song-way-maker',
        songTitle: 'Way Maker',
        artist: 'Sinach / Leeland',
        keyOverride: 'G',
        leadSinger: 'Bea Santos',
        notes: 'Extended bridge prayer.',
        durationMinutes: 8
      },
      {
        id: 'item-y3',
        songId: 'song-what-a-beautiful-name',
        songTitle: 'What A Beautiful Name',
        artist: 'Hillsong Worship',
        keyOverride: 'D',
        leadSinger: 'Joshua & Bea',
        notes: 'Build into altar call.',
        durationMinutes: 7
      }
    ]
  }
];
