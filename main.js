
/* Anbefalede bøger til dig sektion */

// Referere til html element, hvor jeg vil tilføje elementer
const container = document.getElementById('hented') 

// Link til Eaa Bibliotek API
const xml = 'https://eaaa.reindex.net/EAAA/main/Api.php?Focus=newslistall'

function fetchBooks(url) {

    // Henter data asynkront fra "url", med XML format
    fetch(url)
        .then(res => res.text()) // Omdanner vores XML data til tekst og sender vidre til den næste funktion (.then)
        .then((xml => {
        // **NOTE**: "xml" variablen i denne forbindelse er teksten fra API'en i TEKST (string) format
        /* For at vi letter kan bruge XML tekst streng, omdanne vi det til 
            et "XML DOM" objekt. Som vi kan navigere.
        */
            const xmlDoc = new DOMParser().parseFromString(xml, "text/xml");

          /* Vi skal nu navigere dette objekt for at udpege de data vi gerne vil have ud.
            Jeg har kigget på objektet vi for ud og vil gerne have disse elementer: 
                1. Titel
                2. Forfatter
                3. Bog cover URL
        
        **NOTE** i loopet bruger jeg tallet 10 istedet for array.length, 
            fordi jeg kun vil have 10 elementer ud på siden. 
        */
            for (let i = 0; i < 10; i++) {
                // for at gøre det nemmer at skrive, binder navnet variable til "item" til hver bog i systemet.
                const items = xmlDoc.getElementsByTagName('item')[i]
                // Laver en Regex (Regular Expression), som siger 'find alt mellem "/" slash og "." punktum '
                const regex = /\/(.+)\./

                // Checker om vores nuværende bog har en beskrivelse og med forfatter, som vi kan finde.
                const hasAuthor = items.getElementsByTagName('description')[0].textContent.match(regex)
                if (items.getElementsByTagName('description')[0] && hasAuthor ) {

                    // Hvis vi kan det tager alle oplysninger
                    const title = items.getElementsByTagName('title')[0].textContent
                    const author = hasAuthor[1].split('|')[0]
                    const link = items.getElementsByTagName('enclosure')[0].getAttribute('url')
                   
                    // Og tilføjer til siden.
                    appendItems(title, author, link, container)
                } else {
                    // Hvis vi ikke finde beskriver og forfatter udskriver til console, med en fejl.
                    console.error("Item wasn't avalible")
                }
            }
        }))
}

// Funktion tilføjer specifikt html element til en vilkårlig container. 
function appendItems(title, author, link, targetElement) {
// div'en med class "anbefaledet", bliver tilføjet med forskellige datasæt.
    const html =
        `<div class="anbefalet">
        <img src="${link}" alt="${title}">
        <p>${title}  <br> <span class="forfatter">af ${author}</span></p>
        <p class="buy">Lån bog <span><i class="fa fa-shopping-basket"></i></span></p>
    </div>`

    targetElement.insertAdjacentHTML('afterbegin', html)
}

/* Henter søgte bøger til "Søgning resultater" */


// Kode fra Morten Bonderup, Lektor
function imageExists(url, callback) {
    /* Funktionen checker om billedet eksistere hvis ikke giver den besked*/
    var img = new Image();
    img.onload = function () {
        callback(true);
    };
    img.onerror = function () {
        callback(false);
    };
    img.src = url;
}

// Finder elementer fra html dokumentet jeg skal bruge.
const form = document.getElementById('form')
const inputField = document.getElementById('search')
const label = document.getElementById('searchLabel')
const insertSearch = document.getElementById('fill')
const loading = document.getElementById('loading')

// Igang sætter funktion, når formen er udført (submitted)
form.addEventListener('submit', async function (e) {
    // gør at vi ikke sender data, med "action" attribut.
    e.preventDefault() 

    // Synliggøre loading spinner
    loading.style.display = 'inline-block'

    // Checker om vi søger på noget
    if (inputField.value) {
        // Tilføjer "Søgning resultater" label
        label.style.display = 'block'

        // Kalder / Kører funktionen findboeger med variablen af vores bruger input
        // og gemmer data'ne i bindingen "result"
        const result = await findboeger(inputField.value)

        // Resetter / fjerner bøger tilføjet til siden tidliger
        clearBooks(insertSearch) 

        // Kigger på de første 10 elementer i vores data
        for (let i = 0; i < 10; i++) {
            // For hver bog..
            const element = result[i];

            // Check om isbn på bogen IKKE er "ukendt"
            if (element.isbn != 'ukendt') {
                // Hvis ikke, vil vi gerne finde bog coveret på denne URL
                let link = 'http://covers.openlibrary.org/b/isbn/' + element.isbn + '-M.jpg?default=false'

                // Se imageExists() funktionen.
                imageExists(link, state => {

                    // Hvis vi ikke kan finde noget billde med vores URL
                    // Bruger vi vores egen billede resurse.
                    if (!state) {
                        link = 'images/default-book-cover.jpg'
                    }

                    // Tilføj element til siden
                    appendItems(element.title, element.forfatter, link, insertSearch)

                })
            } else {
                // Hvis ikke vi har isbn nummert på bogen findes, bruge også vores egen billede resurse.
                const url = 'images/default-book-cover.jpg'
                appendItems(element.title, element.forfatter, url, insertSearch)
            }

        }

    } else {
        // Hvis der ikke er noget indtasted i feltet, fjern overskriften og skriv i console
        label.style.display = 'none'

        // Optimalt skulle denne besked gå ud til brugeren ^^
        console.warn('Need to put in a book')
    }

    // Når vi er færdige med at hente data ind på siden.
    // Fjern loading spinneren
    loading.style.display = 'none'
})

// Funktionen fjerner alt i et "targetElement"
function clearBooks(targetElement) {
    targetElement.innerHTML = ''
}


async function findboeger(query) {
    // Vi bruger denner URL, til at søge på bøger, forfatter osv. (Hvad API tillader)
    const url = `http://openlibrary.org/search.json?q=${query}`

    // Henter data (samme som tidliger fetch)
    const response = await fetch(url)
    const boeger = await response.json()
    const boger = boeger.docs
    
    // Renser Data
    /* Det er ikke altid at API'en har alle data, 
    man skal derfor sikre sig i mod fejl. Så koden altid virker, uanset hvad.
    Jeg har gjort, så hvis den pågældende værdig ikke findes, skal den sætte til "ukendt".
    */
    const forfatterBoger = []
    for (const bog of boger) {
        forfatterBoger.push({
            title: bog.title,
            isbn: bog.isbn ? bog.isbn[0] : 'ukendt',
            forfatter: bog.author_name,
            udgivelse: bog.publish_date ? bog.publish_date[0] : 'ukendt',
            forlag: bog.publisher ? bog.publisher[0] : 'ukendt'
        })
    }

    // Vidre sender sorteret data til eget forbrug
    return forfatterBoger
}

//   Bibliotekar
// Referere til video element
const bibliotekar = document.querySelector('#bibliotekar video')

// Funktion kører efter 3000ms (3s), efter siden er loaded
setTimeout(function () {
    // Sætte bibliotekar til "idle mode" (står og smiler)
    bibliotekar.src = "bibliotekar/idle.mp4"

}, 3000)

// Funktionen kører når der er focus på input feltet ( clicker i den eller tab til den ).
inputField.addEventListener('focus', e => {
    // Sætte bibliotekar til at vinke
    bibliotekar.src = "bibliotekar/vinker.mp4"

    // Starter videoen
    bibliotekar.play()

    // Skifter tilbage til idle mode, efter 3 sekunder
    setTimeout(function () {
        bibliotekar.src = "bibliotekar/idle.mp4"

    }, 3000)
})

// Genlæser siden, ved click på logo
document.getElementById('logo').addEventListener('click', () => {
    location.reload()
})

// ---------------- Hovede Program ----------------

// Kalder / kører funktionen fetchBooks med variablen "xml"
fetchBooks(xml)