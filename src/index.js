"use strict";

const xml2js = require('xml2js');
const fs = require('fs');
const ftp = require("basic-ftp")

const host = "ftp.bom.gov.au";
const path = "/anon/gen/fwo/";
const file_name = "IDW60920.xml";

(async function () {
    const client = new ftp.Client();
    // client.ftp.verbose = true;
    console.log(`Connect to ${host}`)
    await client.access({
        host: host,
        secure: false,
        // For some reason in node.js using the `basic-ftp` package the
        // username and password cannot be left blank,
        // but anonymous, anonymous seems to work
        user: "anonymous",
        password: "anonymous",
    });
    console.log(`Change cirectory to ${path}`);
    await client.cd(path);
    console.log(`Download ${file_name}`);
    await client.downloadTo(file_name, file_name);
    await client.close();
    console.log("Extract Data")
    process_xml();
    console.log("Done")
})();

function process_xml(_) {
    const xml_data = fs.readFileSync(file_name, 'utf-8');
    xml2js.parseString(xml_data, { explicitArray: false }, function (err, json_data) {
        if (err) {
            console.error(err);
            return;
        }
        const stations = json_data.product.observations.station;
        // Extract table with one row per station
        const station_table = [];
        for(let item of stations){
            station_table.push(item.$)
        }
        console.table(station_table);
        // Extract table with one set of observation from each station (1:1 with the station table)
        const data_table = [];
        for (const station of stations) {
            let row = {};
            data_table.push(row)
            row["bom-id"] = station.$['bom-id'];
            for (const column_name of ['wind_spd_kmh', 'wind_dir_deg', 'gust_kmh', 'air_temperature']) {
                const value = station.period.level.element.find(e => e.$.type === column_name);
                row[column_name] = value ? parseFloat(value._) : null;
            }
        }
        console.table(data_table);
    });
}
