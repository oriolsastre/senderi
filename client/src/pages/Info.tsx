interface InfoProps {
  isAuthenticated: boolean;
}

export default function Info({ isAuthenticated }: InfoProps) {
  return (
    <div className="py-4 max-w-3xl">
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-4 border-b border-purple-500/20 pb-2">Què és això?</h1>
        <p className="mb-4">Senderi és el meu gestor d'excursions. Aquí hi puc tenir reunides les excursions que he fet, i generar-me <i>informes</i> per a poder compartir.</p>
        <p className="mb-4">Generalment quan surto d'excursió gravo el recorregut amb el rGPS, faig fotos d'animals i plantes, faig algunes fotos dels llocs que més m'han agradat; Si al final del dia em demanen: <q><i>Em podràs passar el track?</i></q>, <q><i>Em podràs passar les fotos?</i></q> ho tindré junt al mateix lloc.</p>
        <p className="mb-4">Senderi és on els camins es troben. Aquí no hi tinc <i>res</i>. I és on ho tinc reunit tot.</p>
        <ul className="list-disc pl-5 mb-4">
          <li className="mb-2">El track? El tinc pujat a <b className="text-purple-600">OpenStreetMap</b>.</li>
          <li className="mb-2">Les fotos de llocs notables? Estan pujades a la <b className="text-purple-600">Wikimedia Commons</b> (amb menys freqüència).</li>
          <li>Les fotos d'animals? Estan pujades a l'<b className="text-purple-600">iNaturalist</b>.</li>
        </ul>
        <p className="mb-4">Senderi podria ser un excel. Però així queda una mica més bonic.</p>
        <p className="mb-4">Evientment no totes les fotografies acaben a la Commons. Per cada excursió puc pujar les fotografies que hi he fet (la idea és que sigui temporalment) per a poder-les compartir si m'ho demanen. Així agafes només aquelles que t'interessin.</p>
      </section>

      <section className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-4 border-b border-purple-500/20 pb-2">Excursions i Punts d'interès</h1>
        <p className="mb-4">Per cada excursió intento afegir una descipció i anotar els punts d'interès per on passa. D'aquesta manera, puc mirar quins punts d'interès hi ha en cada excursió, i quines excursions passen per cada punt d'interès.</p>
        <p className="mb-4">Després, la màgia. Si he fet observacions d'animals i les he pujat a l'iNat, seran mostrades i enllaçades. Si he fet alguna fotografia durant l'excursió que ha acabat a la Wikimedia Commons, tres quartes parts del mateix. 🚧 <i>Si he trobat catxés en aquella excursió, la idea serà que també hi apareguin. Però això encara no està disponible.</i> 🚧</p>
        <p className="mb-4">Similar amb les Fites. Si he fet observacions a l'iNat a prop d'un punt d'interès, també seran mostrades i enllaçades. Si alguna fotografia d'aquell punt d'interès ha acabat a la Commons, també el podria veure. I si vols saber-ne més, hi trobaràs enllaços als serveis externs pertinents.</p>
        <p className="mb-4">Al cap i a la fi, però, les dades són tant bones com jo ho permeti. Vull dir, que falten moltes dades. Molts dels punts del mapa els he importat de quan només em guardava els cims. L'excursió associada no l'he pujada o és privada. Molts dels punts no tenen referències als serveis externs. Potser trigo un mes en pujar les fotografies a l'iNaturalist. Ves a saber quan (i si) pujo les fotos al Commons. Què hi farem. Tampoc perdrem... l'oremus. Com a mínim hi ha això. I mica en mica anar construint. Es fa sender al caminar.</p>
      </section>

      <section className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-4 border-b border-purple-500/20 pb-2">Informes</h1>
        <p className="mb-4">Si ho vols, pots crear i imprimir el teu propi informe d'una excursió amb la mateixa estructura de les excursions que hi tinc. Al menú superior tena l'opció de crear un informe. És molt fàcil:</p>
        <ol className="list-decimal pl-5 mb-4">
          <li className="mb-2">Posa-li el títol que vulguis.</li>
          <li className="mb-2">Puja un fitxer .gpx o indica la id del traçat a OpenStreetMap. Això ja et crearà un mapa i perfil d'elevació.</li>
          <li className="mb-2">Afegeix la descripció de l'excursió.</li>
          <li className="mb-2">Afegeix punts de ruta. Posiciona'ls sobre el mapa i tria l'icona que prefereixis. Anomena'ls i posa'ls una descripció si ho vols.</li>
          <li className="mb-2">Si ets usuari d'iNaturalist indica el teu nom d'usuari i la data per mostrar les observacions d'aquell dia (si separes per coma, sense espais, pots afegir més d'un usuari d'iNaturalist).</li>
          <li className="mb-2">I imprimeix!</li>
        </ol>
        <p className="mb-4">Els informes són <b className="text-purple-600">temporals</b>. Res no queda guardat. Si tanques la pestanya o navegues a una altra pàgina es perdrà la informació de l'informe.</p>
      </section>

      <section className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-4 border-b border-purple-500/20 pb-2">Serveis externs</h1>
        <p className="mb-4">Els serveis externs que faig servir són generalment col·laboratius. Plataformes on compartir informació de forma lliure i que la pugui fer servir qui la necessiti. No tots, però.</p>
        <div className="mb-6 ml-4">
          <div className="flex items-center gap-2 flex-1">
            <h2 className="text-2xl font-bold text-black mb-2">OpenStreetMap</h2>
            <a
              href="https://www.openstreetmap.org/about"
              target="_blank"
              rel="noopener noreferrer"
              title="OpenStreetMap"
            >
              <img src="/assets/icons/services/openstreetmap-logo.svg" alt="OSM" className="w-6 h-6" />
            </a>
          </div>
          <p className="mb-2">Mapa col·laboratiu i lliure del món. N'obtinc la cartografia que faig servir als mapes.</p>
        </div>
        <div className="mb-6 ml-4">
          <div className="flex items-center gap-2 flex-1">
            <h2 className="text-2xl font-bold text-black mb-2">iNaturalist</h2>
            <a
              href="https://www.inaturalist.org"
              target="_blank"
              rel="noopener noreferrer"
              title="iNaturalist"
            >
              <img src="https://upload.wikimedia.org/wikipedia/en/7/76/INaturalist_logo.png" alt="iNaturalist" className="w-6 h-6" />
            </a>
          </div>
          <p className="mb-2">Xarxa social de ciència ciutadana per compartir observacions de biodiversitat.</p>
        </div>
        <div className="mb-6 ml-4">
          <div className="flex items-center gap-2 flex-1">
            <h2 className="text-2xl font-bold text-black mb-2">Wikimedia Commons</h2>
            <a
              href="https://commons.wikimedia.org/wiki/Commons:P%C3%A0gina_principal"
              target="_blank"
              rel="noopener noreferrer"
              title="Wikimedia Commons"
            >
              <img src="/assets/icons/services/commons-logo.svg" alt="Wikimedia Commons" className="w-6 h-6" />
            </a>
          </div>
          <p className="mb-2">Repositori de mitjans lliures (imatges, sons, vídeos) de la Wikimedia. És a dir, és el que fa servir la viquipèdia.</p>
        </div>
        <div className="mb-6 ml-4">
          <div className="flex items-center gap-2 flex-1">
            <h2 className="text-2xl font-bold text-black mb-2">Wikidata</h2>
            <a
              href="https://www.wikidata.org/wiki/Wikidata:Main_Page"
              target="_blank"
              rel="noopener noreferrer"
              title="Wikidata"
            >
              <img src="/assets/icons/services/wikidata-logo.svg" alt="Wikidata" className="w-6 h-6" />
            </a>
          </div>
          <p className="mb-2">Base de dades lliure i estructurada que emmagatzema informació de manera llegible per ordinadors. També de la Wikimedia.</p>
        </div>
        <div className="mb-6 ml-4">
          <div className="flex items-center gap-2 flex-1">
            <h2 className="text-2xl font-bold text-black mb-2">Insitut Cartogràfic i Geològic de Catalunya</h2>
            <a
              href="https://www.icgc.cat/"
              target="_blank"
              rel="noopener noreferrer"
              title="Institut Cartogràfic i Geològic de Catalunya"
            >
              <img src="https://www.icgc.cat/themes/custom/icgc_web/favicon.ico" alt="ICGC" className="w-6 h-6" />
            </a>
          </div>
          <p className="mb-2">N'obtinc la cartografia que faig servir als mapes.</p>
        </div>
      </section>

      <section className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-4 border-b border-purple-500/20 pb-2">Contacte</h1>
        <p className="mb-4">Si has arribat fins aquí és que probablement saps qui sóc. Qualsevol cosa, dubte, suggerència, notificació d'error, no dubtis en comentar-m'ho.</p>
      </section>
    </div>
  );
}
