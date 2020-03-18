const container = document.getElementById('hented')

const xml = 'https://eaaa.reindex.net/EAAA/main/Api.php?Focus=newslistall'
booksFetch(xml)

function booksFetch(url) {
    fetch(url)
        .then(res => res.text())
        .then((xml => {
            parser = new DOMParser();
            xmlDoc = parser.parseFromString(xml, "text/xml");

            // var arr = Array.from(xmlDoc.getElementsByTagName('item'));
            for (let i = 0; i < 10; i++) {
                const items = xmlDoc.getElementsByTagName('item')[i]
                const regex = /\/(.+)\./

                if (items.getElementsByTagName('description')[0] && items.getElementsByTagName('description')[0].textContent.match(regex)) {
                    const title = items.getElementsByTagName('title')[0].textContent

                    // console.log(items.getElementsByTagName('description')[0].textContent.match(regex));
                    const author = items.getElementsByTagName('description')[0].textContent.match(regex)[1].split('|')[0]

                    const link = items.getElementsByTagName('enclosure')[0].getAttribute('url')
                    // console.log(title + '\n', author + '\n', link);
                    appendItems(title, author, link, container)
                } else {
                    console.error("Item wasn't avalible")
                }

            }




        }))

}

function imageExists(url, callback) {
    var img = new Image();
    img.onload = function () {
        callback(true);
    };
    img.onerror = function () {
        callback(false);
    };
    img.src = url;
}

function appendItems(title, author, link, targetElement) {

    const html =
        `<div class="anbefalet">
        <img src="${link}" alt="${title}">
        <p>${title}  <br> <span class="forfatter">af ${author}</span></p>
        <p class="buy">Lån bog <span><i class="fa fa-shopping-basket"></i></span></p>
    </div>`

    targetElement.insertAdjacentHTML('afterbegin', html)
}

const form = document.getElementById('form')
const inputField = document.getElementById('search')
const label = document.getElementById('searchLabel')
const insertSearch = document.getElementById('fill')
const loading = document.getElementById('loading')
form.addEventListener('submit', async function (e) {
    e.preventDefault()
    loading.style.display = 'block'
    if (inputField.value) {
        label.style.display = 'block'
        const result = await findboeger(inputField.value)
        clearBooks(insertSearch) // Problem with only loading spinner once
        for (let i = 0; i < 10; i++) {
            const element = result[i];

            if (element.isbn != 'ukendt') {
                let link = 'http://covers.openlibrary.org/b/isbn/' + element.isbn + '-M.jpg?default=false'
                // console.log(link);

                imageExists(link, state => {
                    if (!state) {
                        link = 'images/default-book-cover.jpg'
                    }
                    appendItems(element.title, element.forfatter, link, insertSearch)

                })
            } else {

                const url = 'images/default-book-cover.jpg'
                appendItems(element.title, element.forfatter, url, insertSearch)
            }

        }

    } else {
        label.style.display = 'none'
        console.warn('Need to put in a book')
    }


    loading.style.display = 'none'
})

function clearBooks(targetElement) {
    targetElement.innerHTML = ''
}


async function findboeger(query) {
    const url = `http://openlibrary.org/search.json?q=${query}`

    // Henter data
    const response = await fetch(url)
    const boeger = await response.json()
    const boger = boeger.docs
    // Renser Data
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

    return forfatterBoger
}

//   Bibliotekar
const bibliotekar = document.querySelector('#bibliotekar video')
setTimeout(function () {
    bibliotekar.src = "bibliotekar/idle.mp4"
    bibliotekar.loop = true
}, 3000)

inputField.addEventListener('focus', e => {
    bibliotekar.src = "bibliotekar/vinker.mp4"
    bibliotekar.play()
    bibliotekar.loop = false
    setTimeout(function () {
        bibliotekar.src = "bibliotekar/idle.mp4"
        bibliotekar.loop = true
    }, 3000)
})


// Gå hjem
document.getElementById('logo').addEventListener('click', () => {
    location.reload()
})