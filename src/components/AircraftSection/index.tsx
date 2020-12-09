import React from 'react';
import { Select, Typography, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { ButtonsContainer as SelectionContainer, Content, Container, HeaderImage, InstallButton, ModelInformationContainer, ModelName, ModelSmallDesc, VersionSelect, EngineOptionsContainer, EngineOption, DownloadProgress } from './styles';
import Store from 'electron-store';
import * as fs from "fs";
import Zip from 'adm-zip';
import LeapEngineSVG from '../../assets/cfm_leap1-a.svg'

const settings = new Store;

const { Option } = Select;
const { Paragraph } = Typography;

type a32nxVersion = {
    name: string,
    key: string,
    url: string,
}

type indexProps = {
    isDownloading: boolean,
    setIsDownloading: React.Dispatch<React.SetStateAction<boolean>>,
    downloadPercentage: number,
    setDownloadPercentage: React.Dispatch<React.SetStateAction<number>>,
    aircraftModel: string,
    isUpdated: boolean,
    setIsUpdated: React.Dispatch<React.SetStateAction<boolean>>,
}

const index: React.FC<indexProps> = (props: indexProps) => {
    const versions: a32nxVersion[] = [
        {
            name: 'Development',
            key: 'Development',
            url: 'https://flybywiresim-packages.nyc3.cdn.digitaloceanspaces.com/vmaster/A32NX-master.zip'
        },
        {
            name: 'Stable',
            key: 'Stable',
            url: '',
        }
    ];

    async function checkForA32nxUpdate(version: a32nxVersion) {
        {/* TODO: Implement the check version logic */}
        const localLastUpdate = settings.get('cache.lastUpdatedA32nx');

        const res = await fetch(version.url);

        const webLastUpdate = res.headers.get('Last-Modified').toString();

        if (typeof localLastUpdate === "string") {
            if (localLastUpdate === webLastUpdate) {
                console.log("Is Updated");
                props.setIsUpdated(true);
            } else {
                console.log("Is not Updated");
                props.setIsUpdated(false);
            }
        } else {
            console.log("Failed");
            props.setIsUpdated(false);
        }
    }

    async function downloadA32nx(version: a32nxVersion) {
        if (!props.isDownloading) {
            props.setIsDownloading(true);
            const msfs_package_dir = settings.get('mainSettings.msfsPackagePath');

            const deleteHandle = fs.rmdir(msfs_package_dir + 'A32NX\\', {recursive: true}, () => {
                console.log("Deleted original file");
            });

            const a32nxResp = await fetch(version.url).then((res) => {
                console.log("Starting Download");
                return res;
            });

            const a32nxReader = a32nxResp.body.getReader();
            const a32nxLength = +a32nxResp.headers.get('Content-Length');
            const a32nxUpdateTime = a32nxResp.headers.get('Last-Modified');

            let a32nxRecievedLength = 0;
            const chunks = [];

            let lastPercentFloor = 0;

            for (;;) {
                const {done, value} = await a32nxReader.read();

                if (done) {
                    break;
                }

                chunks.push(value);
                a32nxRecievedLength += value.length;

                const newPercentFloor = Math.floor((a32nxRecievedLength / a32nxLength) * 100);

                if (lastPercentFloor !== newPercentFloor) {
                    lastPercentFloor = newPercentFloor;
                    props.setDownloadPercentage(lastPercentFloor);
                }
            }

            const chunksAll = new Uint8Array(a32nxLength);
            let position = 0;
            for (const chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
            }

            const a32nxCompressed = Buffer.from(chunksAll);

            if (typeof msfs_package_dir === "string") {
                const a32nx = new Zip(a32nxCompressed);

                await deleteHandle;

                a32nx.extractAllTo(msfs_package_dir);
            }
            props.setIsDownloading(false);
            props.setDownloadPercentage(0);
            settings.set('cache.lastUpdatedA32nx', a32nxUpdateTime);
            console.log("Download complete!");
        }
    }

    return (
        <Container>
            <HeaderImage>
                <ModelInformationContainer>
                    <ModelName>
                        {props.aircraftModel}
                    </ModelName>
                    <ModelSmallDesc>
                        Airbus A320neo Series
                    </ModelSmallDesc>
                </ModelInformationContainer>
                <SelectionContainer>
                    {/** <AircraftModelSelect defaultValue="A320neo" style={{ width: 120 }}>
                        <Option value="A320neo">A320neo</Option>
                        <Option value="A321neo">A321neo</Option>
                        <Option value="A319">A319</Option>
                    </AircraftModelSelect> **/}
                    {/* TODO: Implement the check version logic */}
                    {/* <Button onClick={() => checkForA32nxUpdate(versions[0])}>Check for update</Button> */}
                    <VersionSelect defaultValue="Version" style={{ width: 130}}>
                        {
                            versions.map(version =>
                                <Option value={version.name} key={version.key}>{version.name}</Option>
                            )
                        }
                    </VersionSelect>
                    <InstallButton
                        type="primary"
                        icon={<DownloadOutlined />}
                        loading={props.isDownloading}
                        onClick={() => downloadA32nx(versions[0])}
                        style={{ background: "#00CB5D", borderColor: "#00CB5D" }}
                    >{props.isDownloading ? `${props.downloadPercentage}%` : props.isUpdated ? "Installed" : "Install"}</InstallButton>
                </SelectionContainer>
            </HeaderImage>
            <DownloadProgress percent={props.downloadPercentage} showInfo={false} status="active" />
            <Content>
                <>
                    <h3>Details</h3>
                    <Paragraph style={{ color: '#858585' }}>
                        The A320neo (new engine option) is one of many upgrades introduced by Airbus to help maintain
                        its A320 product line’s position as the world’s most advanced and fuel-efficient single-aisle
                        aircraft family. The baseline A320neo jetliner has a choice of two new-generation engines
                        (the PurePower PW1100G-JM from Pratt and Whitney and the LEAP-1A from CFM International)
                        and features large, fuel-saving wingtip devices known as Sharklets.
                    </Paragraph>
                </>
                <EngineOptionsContainer>
                    <h3>Variants</h3>
                    <EngineOption>
                        <img src={LeapEngineSVG} />
                        <span>Neo (CFM LEAP-1A) / (PW1100G-JM)</span>
                    </EngineOption>
                </EngineOptionsContainer>
            </Content>
        </Container>
    );
};

export default index;
