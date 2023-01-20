import {
    Box,
    Heading,
    Text,
    Grid,
    ResponsiveContext,
    CheckBox,
    Meter,
    Table,
    TableHeader,
    TableRow,
    TableCell,
    TableBody
} from 'grommet'
import React, { useEffect, useContext, useState, useMemo } from 'react';
import { AppContext } from '../../data/appContext'
import { NextSeo } from 'next-seo';

import ShadowBox from '../../components/base/ShadowBox';
import TabButton from '../../components/base/TabButton';
import { Refinery } from '../../data/domain/refinery';
import { Item } from '../../data/domain/items';
import { Storage } from '../../data/domain/storage';
import { nFormatter, toTime } from '../../data/utility';
import { SaltLick } from '../../data/domain/saltLick';
import { Alchemy } from '../../data/domain/alchemy';
import { StaticTime, TimeDisplaySize, TimeDown } from '../../components/base/TimeDisplay';
import { Printer } from '../../data/domain/printer';
import { Player } from '../../data/domain/player';
import { CircleInformation, StatusWarning, Trash } from 'grommet-icons';
import TipDisplay, { TipDirection } from '../../components/base/TipDisplay';
import { Deathnote } from '../../data/domain/deathnote';
import { EnemyInfo } from '../../data/domain/enemies';
import TextAndLabel from '../../components/base/TextAndLabel';
import { ClassIndex, Talent } from '../../data/domain/talents';
import { TaskBoard } from '../../data/domain/tasks';
import { Shrine } from '../../data/domain/shrines';
import { MapInfo } from '../../data/domain/maps';
import { Card } from '../../data/domain/cards';
import { Lab } from '../../data/domain/lab';
import IconImage from '../../components/base/IconImage';
import { Sigils } from '../../data/domain/sigils';
import { BuildingsDisplay } from '../../components/world-3/construction/buildings';
import { SaltLickDisplay } from '../../components/world-3/construction/saltLick';


function RefineryDisplay() {
    const [playerData, setPlayerData] = useState<Player[]>();
    const [refineryData, setRefineryData] = useState<Refinery>();
    const [storage, setStorage] = useState<Storage>();
    const [itemData, setItemData] = useState<Item[]>();
    const [saltLickData, setSaltLickData] = useState<SaltLick>();
    const [alchemyData, setAlchemyData] = useState<Alchemy>();
    const [taskboardData, setTaskboardData] = useState<TaskBoard>();
    const [lastUpdated, setLastUpdated] = useState<Date | undefined>();
    const [squirePowha, setSquirePowha] = useState<boolean>(false);
    const [printer, setPrinter] = useState<Printer>();
    const appContext = useContext(AppContext);
    const size = useContext(ResponsiveContext);

    const cycleInfo = useMemo(() => {
        if (!refineryData) {
            return [];
        }
        const lab = appContext.data.getData().get("lab") as Lab;
        const sigils = appContext.data.getData().get("sigils") as Sigils;
        const labCycleBonus = lab?.bonuses.find(bonus => bonus.name == "Gilded Cyclical Tubing")?.active ?? false ? 3 : 1;
        const vialBonus = alchemyData?.vials.find((vial) => vial.description.includes("Refinery Cycle Speed"))?.getBonus() ?? 0;
        const saltLickBonus = saltLickData?.getBonus(2) ?? 0;
        const secondsSinceUpdate = (new Date().getTime() - (lastUpdated?.getTime() ?? 0)) / 1000;

        const toReturn = [
            { name: "Combustion", time: Math.ceil((900 * Math.pow(4, 0)) / ((1 + (vialBonus + saltLickBonus + sigils.sigils[10].getBonus()) / 100) * labCycleBonus)), timePast: refineryData.timePastCombustion + secondsSinceUpdate }
        ];

        if (Object.keys(refineryData.salts).length > 3) {
            toReturn.push(
                { name: "Synthesis ", time: Math.ceil((900 * Math.pow(4, 1)) / ((1 + (vialBonus + saltLickBonus + sigils.sigils[10].getBonus()) / 100) * labCycleBonus)), timePast: refineryData.timePastSynthesis + secondsSinceUpdate }
            );
        }
        return toReturn;
    }, [refineryData, saltLickData, alchemyData]);

    const squireInfo = useMemo(() => {
        const squires = playerData?.filter(player => (player.classId == ClassIndex.Squire || player.classId == ClassIndex.Divine_Knight));
        return squires;
    }, [playerData])

    const squireTimeSave = useMemo(() => {
        const theSlowRockMethod = () => {
            const toReturn: number[] = [];
            if (refineryData?.salts) {
                Object.entries(refineryData.salts).forEach(([salt, info], index) => {
                    const currentCooldowns: [Player, number][] = [];
                    squireInfo && squireInfo.forEach(squire => {
                        currentCooldowns.push([squire, squire.getCurrentCooldown(130)]);
                    });
                    let totalWait = 0;
                    let timeToNextRank = info.getTimeToNextRank(cycleInfo[Math.floor(index / 3)].time);
                    while (timeToNextRank > 0) {
                        const nextCDTime = Math.min(...currentCooldowns.map(cooldowns => cooldowns[1]));
                        if (timeToNextRank > nextCDTime) {
                            totalWait += nextCDTime;
                            timeToNextRank -= nextCDTime;
                            currentCooldowns.forEach(([squire, _], squireIndex, originalArray) => {
                                originalArray[squireIndex][1] -= nextCDTime; // adjust the actual array data
                                if (originalArray[squireIndex][1] == 0) {
                                    const manaBox = squire.postOffice.find(box => box.name == "Magician Starterpack");
                                    const cdReduction = manaBox?.bonuses[2].getBonus(manaBox.level, 2) ?? 0;
                                    originalArray[squireIndex][1] = Math.floor((1 - cdReduction / 100) * 72000);
                                    const timePerSquireSkilluse = (squire.talents.find(talent => talent.skillIndex == 130)?.getBonus(false, false, true) ?? 0) * cycleInfo[Math.floor(index / 3)].time
                                    timeToNextRank -= timePerSquireSkilluse;
                                    if (timeToNextRank < 0) {
                                        timeToNextRank = 0;
                                    }
                                }
                            })
                        }
                        else {
                            totalWait += timeToNextRank
                            timeToNextRank = 0;
                        }
                    }
                    toReturn.push(totalWait);
                })
            }
            return toReturn;
        }
        if (squirePowha) {
            return theSlowRockMethod();
        }


        return [];

    }, [squireInfo, refineryData, cycleInfo, squirePowha])

    const saltMeritLevel = useMemo(() => {
        const saltMerit = taskboardData?.merits.find(merit => merit.descLine1 == "Refinery Salt Costs don't scale beyond");
        return (saltMerit?.level ?? 0) + 1;

    }, [taskboardData]);

    useEffect(() => {
        if (appContext) {
            const theData = appContext.data.getData();
            setLastUpdated(appContext.data.getLastUpdated(true) as Date);
            setRefineryData(theData.get("refinery"));
            setItemData(theData.get("itemsData"));
            setStorage(theData.get("storage"));
            setSaltLickData(theData.get("saltLick"));
            setAlchemyData(theData.get("alchemy"));
            setPlayerData(theData.get("players"));
            setTaskboardData(theData.get("taskboard"));
            setPrinter(theData.get("printer"));
        }
    }, [appContext, refineryData]);

    if (!refineryData || Object.entries(refineryData.salts).filter(([name, saltInfo]) => saltInfo.rank > 0).length == 0) {
        return (
            <Box align="center" pad="medium">
                <Heading level='3'>Come back when you unlocked this!</Heading>
            </Box>
        )
    }

    return (
        <Box gap="medium">
            <Box direction="row" wrap justify="center">
                {
                    cycleInfo.map((cycle, index) => {
                        return (
                            <ShadowBox margin={{ right: 'large', bottom: 'small' }} background="dark-1" key={index} gap="xsmall" pad="medium" align="center">
                                <TextAndLabel center textSize='xsmall' labelSize='medium' text='Next cycle in' label={cycle.name} />
                                <Box>
                                    <TimeDown addSeconds={cycle.time - cycle.timePast} resetToSeconds={cycle.time} />
                                </Box>
                                <Text margin={{ top: 'small' }} color="accent-3" size="12px">* Might be off by a few seconds.</Text>
                                <Text color="accent-3" size="12px">Max cycle is: {toTime(cycle.time)}</Text>
                            </ShadowBox>
                        )
                    })
                }
                {squireInfo && squireInfo.map((squire, index) => {
                    const [refineryTalent, cooldown] = [...squire.cooldown.entries()].filter(([talent, cooldown]) => talent.skillIndex == 130)?.pop() as [Talent, number];
                    const realCD = cooldown - squire.afkFor;
                    return (
                        <ShadowBox key={index} background="dark-1" pad="medium" align="center" margin={{ right: 'large', bottom: 'small' }}>
                            <Box gap="small">
                                <Box direction="row" gap="small">
                                    <IconImage data={squire.getClassImageData()} scale={0.8} />
                                    <Text>{squire.playerName}</Text>
                                </Box>
                                <Box direction="row" gap="small">
                                    <Box style={{ opacity: realCD <= 0 ? 1 : 0.5 }}>
                                        <IconImage data={refineryTalent.getImageData()} scale={0.8} />
                                    </Box>
                                    {realCD > 0 && <TimeDown size={TimeDisplaySize.Small} addSeconds={realCD} resetToSeconds={72000} />}
                                    {realCD <= 0 && <Text>Skill is ready!</Text>}
                                </Box>
                            </Box>
                        </ShadowBox>
                    )
                })
                }
            </Box>
            <CheckBox
                checked={squirePowha}
                label={<Box direction="row" align="center">
                    <Text margin={{ right: 'xsmall' }} size="small">Squire Power</Text>
                    <TipDisplay
                        body={<Box gap="xsmall">
                            <Text>This will make the following assumptions and calculate their impact on the time to rank-up:</Text>
                            <Text>* Assume perfect use of squire skill on CD.</Text>
                            <Text>* This is assuming the highest possible level for the squire skill based on your max talent level.</Text>
                        </Box>}
                        size="small"
                        heading='Squire Power!'
                        maxWidth='medium'
                        direction={TipDirection.Down}
                    >
                        <CircleInformation size="small" />
                    </TipDisplay>
                </Box>}
                onChange={(event) => setSquirePowha(event.target.checked)}
            />
            <Text>This is WIP - fuel times don&apos;t account for printer or auto refine salt generation.</Text>
            {
                refineryData?.salts && Object.entries(refineryData.salts).map(([salt, info], index) => {
                    const saltItem = itemData?.find((item) => item.internalName == salt);
                    const costItems = info.baseCost.map((cost) => cost.item);
                    const storageItems = itemData?.filter((item) => costItems.includes(item.internalName)) ?? [];
                    storageItems.forEach((storageItem) => {
                        const inSaltStorage = refineryData.storage.find((saltStorageItem) => saltStorageItem.name == storageItem.internalName);
                        const inChestStorage = storage?.chest.find((item) => item.internalName == storageItem.internalName)
                        storageItem.count = (inSaltStorage?.quantity ?? 0) + (inChestStorage?.count ?? 0);
                    });
                    const secondsSinceUpdate = (new Date().getTime() - (lastUpdated?.getTime() ?? 0)) / 1000;
                    const fuelTime = info.getFuelTime(storageItems, [], index <= saltMeritLevel) * cycleInfo[Math.floor(index / 3)].time - secondsSinceUpdate;
                    const timeToNextRank = info.getTimeToNextRank(cycleInfo[Math.floor(index / 3)].time) - secondsSinceUpdate;

                    if (saltItem) {
                        return (
                            <ShadowBox key={index} background="dark-1">
                                <Grid columns={size == "small" ? ["50%", "50%"] : ["15%", "20%", "25%", "20%", "20%"]}>
                                    <Box direction="row" gap="medium" align="center" background="dark-2" pad="medium" justify="center" fill>
                                        <Box align="center">
                                            <Box title={saltItem.displayName}>
                                                <IconImage data={saltItem.getImageData()} scale={2} />
                                            </Box>
                                            <Box align="center">
                                                <Text size="large">{info.rank}</Text>
                                                <Text color="accent-2" size="small">Rank</Text>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box pad="medium" align="center">
                                        <Box pad={{ vertical: "medium" }} gap="small" border={{ color: 'grey-1', side: 'right', size: '3px' }} fill>
                                            {
                                                timeToNextRank > 0 ?
                                                    <Box>
                                                        <Text color="accent-2" size="small">Rank up in</Text>
                                                        <Box>
                                                            {fuelTime > 0 && (info.active ?
                                                                <TimeDown size={size == "medium" ? TimeDisplaySize.Medium : TimeDisplaySize.Large} addSeconds={squirePowha ? squireTimeSave[index] : timeToNextRank} />
                                                                : <StaticTime size={size == "medium" ? TimeDisplaySize.Medium : TimeDisplaySize.Large} fromSeconds={squirePowha ? squireTimeSave[index] : timeToNextRank} color='accent-1' />
                                                            )}
                                                            {!info.active && <Box margin={{ top: 'medium' }}><Text color="accent-1" size="medium">Not active</Text></Box>}
                                                        </Box>
                                                    </Box>
                                                    :
                                                    <Box >
                                                        <Text size="xlarge">Rank up ready</Text>
                                                    </Box>
                                            }
                                        </Box>
                                    </Box>
                                    <Box pad="medium">
                                        <Box gap="small" border={{ color: 'grey-1', side: 'right', size: '3px' }} fill>
                                            <Box>
                                                <Text color="accent-2" size="small">Power</Text>
                                                <Text size="medium">{info.progress} / {info.getCap()}</Text>
                                            </Box>
                                            <Box>
                                                <Text color="accent-2" size="small">Auto Refine at</Text>
                                                <Text size="medium">{info.autoRefine}%</Text>
                                            </Box>
                                            <Box>
                                                <Text color="accent-2" size="small">Fuel</Text>
                                                {fuelTime > 0 && (info.active ?
                                                    <TimeDown color={fuelTime > timeToNextRank ? 'green-1' : 'accent-1'} addSeconds={fuelTime} />
                                                    : <StaticTime color={fuelTime > timeToNextRank ? 'green-1' : 'accent-1'} fromSeconds={fuelTime} />
                                                )}
                                                {fuelTime <= 0 && <Text color="accent-1" size="small">Empty</Text>}
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box pad="medium">
                                        <Box wrap align="start" gap="small" border={{ color: 'grey-1', side: 'right', size: '3px' }} fill>
                                            <Text size="small">Cost per hour</Text>
                                            <Box gap="xsmall">
                                                {
                                                    info.baseCost && info.baseCost.map((costData, costIndex) => {
                                                        const costItem = itemData?.find((item) => item.internalName == costData.item);
                                                        const itemCost = costData.quantity * info.getCostMulti(costData.item.includes("Refinery"), index <= saltMeritLevel);
                                                        const cyclesPerHour = Math.ceil(3600 / cycleInfo[Math.floor(index / 3)].time);
                                                        const isSalt = costItem?.internalName.includes("Refinery");
                                                        const currentPrinting = printer?.GetTotalActive(costData.item) ?? 0;
                                                        if (costItem != undefined) {
                                                            return (
                                                                <Box key={costIndex} direction="row" align="center">
                                                                    <Box title={costItem.displayName}>
                                                                        <IconImage data={costItem.getImageData()} scale={0.8} />
                                                                    </Box>
                                                                    {
                                                                        isSalt ?
                                                                            <Box direction="row" gap="xsmall" align="center">
                                                                                <Text size="small">{nFormatter(itemCost * cyclesPerHour, "Smaller")}</Text>
                                                                            </Box>
                                                                            :
                                                                            <TipDisplay
                                                                                heading='Printing'
                                                                                body={`Currently printing ${nFormatter(currentPrinting, "Smaller")}`}
                                                                                direction={TipDirection.Left}
                                                                                size="Small"
                                                                            >
                                                                                <Box direction="row" gap="xsmall" align="center">
                                                                                    <Text color={currentPrinting > itemCost * cyclesPerHour ? 'green-1' : 'red'} size="small">{nFormatter(itemCost * cyclesPerHour, "Smaller")}</Text>
                                                                                </Box>
                                                                            </TipDisplay>
                                                                    }
                                                                </Box>
                                                            )
                                                        }
                                                    })
                                                }
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box pad="medium">
                                        <Box wrap align="start" gap="small">
                                            <Text size="small">Cost to rank up</Text>
                                            <Box gap="xsmall">
                                                {
                                                    info.baseCost && info.baseCost.map((costData, costIndex) => {
                                                        const costItem = itemData?.find((item) => item.internalName == costData.item);
                                                        const itemCost = costData.quantity * info.getCostMulti(costData.item.includes("Refinery"), index <= saltMeritLevel);
                                                        const storageQuantity = storageItems.find(x => x.internalName == costData.item)?.count ?? 0;
                                                        const resourceCostToMax = info.getCyclesTillNextRank() * itemCost;
                                                        if (costItem != undefined) {
                                                            return (
                                                                <Box key={costIndex} direction="row" align="center">
                                                                    <Box title={costItem.displayName}>
                                                                        <IconImage data={costItem.getImageData()} scale={0.8} />
                                                                    </Box>
                                                                    <Box direction="row" gap="xsmall" align="center">
                                                                        <Text color={storageQuantity < resourceCostToMax ? 'accent-1' : ''} size="small">{nFormatter(resourceCostToMax)}</Text>
                                                                        <Text size="small">({nFormatter(storageQuantity)})</Text>
                                                                    </Box>
                                                                </Box>
                                                            )
                                                        }
                                                    })
                                                }
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>
                            </ShadowBox>
                        )
                    }
                }
                )
            }
        </Box>
    )
}

function SampleBox({ sample, activeItem, itemData, inLab = false }: { sample: { item: string, quantity: number }, activeItem: { item: string, quantity: number } | undefined, itemData: Item[] | undefined, inLab?: boolean }) {
    const sampleItem = itemData?.find((item) => item.internalName == sample.item);
    return (
        <Box border={{ color: 'grey-1' }} background="accent-4" width={{ max: '100px', min: '100px' }} height={{ min: '82px', max: '82px' }} direction="row" align="center" justify="center">
            {sample.item == "Blank" || !sample.item ?
                <Box align="center" width={{ max: '100px', min: '100px' }} height={{ min: '82px', max: '82px' }} justify='center'>
                    <Text size="xsmall" color="accent-3">Empty</Text>
                </Box> :
                <Box pad={{ vertical: 'small' }} align="center">
                    <IconImage data={(sampleItem as Item).getImageData()} />
                    <Text color={inLab == true ? 'blue-3' : activeItem ? 'green-1' : ''} size="small">{nFormatter(inLab ? sample.quantity * 2 : sample.quantity)}</Text>
                </Box>
            }
            {activeItem && (activeItem?.quantity ?? 0) < sample.quantity &&
                <TipDisplay
                    heading='Active lower than sample'
                    body={<Box><Text>You have a sample of {nFormatter(sample.quantity)} but only printing {nFormatter(activeItem.quantity)}.</Text><Text>Go update your printing!</Text></Box>}
                    size='large'
                    direction={TipDirection.Down}
                >
                    <StatusWarning size="medium" color="accent-1" />
                </TipDisplay>
            }
        </Box>
    )

}

function PrinterDisplay() {
    const [playerData, setPlayerData] = useState<Player[]>();
    const [printerData, setPrinterData] = useState<Printer>();
    const [itemData, setItemData] = useState<Item[]>();
    const appContext = useContext(AppContext);

    useEffect(() => {
        if (appContext) {
            const theData = appContext.data.getData();
            setItemData(theData.get("itemsData"));
            setPrinterData(theData.get("printer"));
            setPlayerData(theData.get("players"));
        }
    }, [appContext]);

    const masteroInfo = useMemo(() => {
        const masteroes = playerData?.filter(player => player.classId == ClassIndex.Maestro);
        return masteroes;
    }, [playerData])

    if (!printerData || printerData.playerInfo.flatMap(player => [...player.samples, ...player.active]).filter(sample => sample.item != "Blank").length == 0) {
        return (
            <Box align="center" pad="medium">
                <Heading level='3'>Come back when you have some samples!</Heading>
            </Box>
        )
    }
    return (
        <Box gap="medium">
            <Box direction="row" wrap justify="center">
                {masteroInfo && masteroInfo.map((mastero, index) => {
                    const [printerTalent, cooldown] = [...mastero.cooldown.entries()].filter(([talent, cooldown]) => talent.skillIndex == 32)?.pop() as [Talent, number];
                    const realCD = cooldown - mastero.afkFor;
                    return (
                        <ShadowBox key={index} background="dark-1" pad="medium" align="center" margin={{ right: 'large', bottom: 'small' }}>
                            <Box gap="small">
                                <Box direction="row" gap="small">
                                    <IconImage data={mastero.getClassImageData()} scale={0.8} />
                                    <Text>{mastero.playerName}</Text>
                                </Box>
                                <Box direction="row" gap="small">
                                    <Box style={{ opacity: realCD <= 0 ? 1 : 0.5 }}>
                                        <IconImage data={printerTalent.getImageData()} scale={0.8} />
                                    </Box>
                                    {realCD > 0 && <TimeDown size={TimeDisplaySize.Small} addSeconds={realCD} resetToSeconds={82000} />}
                                    {realCD <= 0 && <Text>Skill is ready!</Text>}
                                </Box>
                            </Box>
                        </ShadowBox>
                    )
                })
                }
            </Box>
            <ShadowBox background="dark-1" pad="large">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableCell>Player Name</TableCell >
                            <TableCell>Samples</TableCell >
                            <TableCell>Printing</TableCell >
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {
                            printerData.playerInfo.map((playerInfo, index) => {
                                return (
                                    <TableRow key={`player_${index}`}>
                                        <TableCell>{playerData && playerData[index] && playerData[index].playerName}</TableCell>
                                        <TableCell>
                                            <Box direction="row">
                                                {
                                                    playerInfo.samples.map((sample, sampleIndex) => {
                                                        const activeItem = playerInfo.active.find((activeItem) => activeItem.item == sample.item);
                                                        return (
                                                            <SampleBox key={`sample_${sampleIndex}`} activeItem={activeItem} sample={sample} itemData={itemData} />
                                                        )
                                                    })
                                                }
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box direction="row">
                                                {
                                                    playerInfo.active.map((sample, sampleIndex) => {
                                                        return (
                                                            <SampleBox key={`active_${sampleIndex}`} activeItem={undefined} sample={sample} itemData={itemData} inLab={playerInfo.inLab} />
                                                        )
                                                    })
                                                }
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        }
                    </TableBody>
                </Table>
            </ShadowBox>
        </Box>
    )

}

function DeathnoteDisplay() {
    const [deathnoteData, setDeathnoteData] = useState<Deathnote>();
    const appContext = useContext(AppContext);
    const size = useContext(ResponsiveContext);

    const monsterInfo = EnemyInfo;

    const deathNoteByWorld = useMemo(() => {
        const toReturn = new Map<string, Map<string, number>>();
        if (!deathnoteData) {
            return toReturn;
        }

        deathnoteData.mobKillCount.forEach((killArray, mobName) => {
            const monsterData = monsterInfo.find((monster) => monster.id == mobName);
            const killCount = killArray.reduce((sum, killCount) => sum += Math.round(killCount), 0);
            if (monsterData?.mapData?.world) {
                if (!toReturn.has(monsterData.mapData.world)) {
                    toReturn.set(monsterData.mapData.world, new Map<string, number>());
                }

                toReturn.get(monsterData.mapData.world)?.set(monsterData.details.Name, killCount);
            }
        });
        return toReturn;
    }, [deathnoteData, monsterInfo])

    const worldTierInfo = useMemo(() => {
        const toReturn: number[] = [];
        if (deathNoteByWorld.size == 0) {
            return toReturn;
        }

        [...deathNoteByWorld.entries()].forEach(([worldName, deathnoteMobs]) => {
            const worldRankSum = [...deathnoteMobs.values()].reduce((sum, killCount) => sum += deathnoteData?.getDeathnoteRank(killCount) ?? 0, 0);
            toReturn.push(worldRankSum);
        })
        return toReturn;
    }, [deathNoteByWorld, deathnoteData])

    useEffect(() => {
        if (appContext) {
            const theData = appContext.data.getData();
            setDeathnoteData(theData.get("deathnote"));
        }
    }, [appContext]);

    if (!deathnoteData) {
        return (
            <Box align="center" pad="medium">
                <Heading level='3'>Come back when you unlocked this!</Heading>
            </Box>
        )
    }

    return (
        <Box wrap direction="row" justify="center">
            {
                deathNoteByWorld && [...deathNoteByWorld.entries()].map(([worldName, deathnoteMobs], index) => {
                    return (
                        <ShadowBox width={{ max: '250px' }} background="dark-1" key={index} pad="medium" margin={{ right: 'small', bottom: 'medium' }}>
                            <Text size="small">{worldName} ({worldTierInfo[index]}%)</Text>
                            {
                                [...deathnoteMobs.entries()].map(([mobName, killCount], mobIndex) => {
                                    const deathnoteRank = deathnoteData.getDeathnoteRank(killCount);
                                    return (
                                        <Box key={mobIndex} pad={{ vertical: 'small' }} margin={{ bottom: 'xsmall' }}>
                                            <Box direction="row" align="center" gap="small">
                                                <Box gap="xsmall">
                                                    <Box direction="row" gap="xsmall" align="center" margin={{ bottom: '8px' }}>
                                                        <IconImage data={deathnoteData.getRankImageData(deathnoteRank)} />
                                                        <Box margin={{top: '8px'}}>
                                                            <Text size="small">{mobName}</Text>
                                                        </Box>
                                                    </Box>
                                                    <Meter
                                                        size="small"
                                                        thickness='8px'
                                                        type="bar"
                                                        round={true}
                                                        background="grey-1"
                                                        color="brand"
                                                        values={[
                                                            {
                                                                value: killCount,
                                                                label: 'current',
                                                                color: 'brand'
                                                            }
                                                        ]}
                                                        max={deathnoteData?.getNextRankReq(deathnoteRank)} />
                                                    <Box direction="row" justify="between">
                                                        <Text color='grey-2' size="xsmall">{nFormatter(killCount)}</Text>
                                                        <Text color='grey-2' size="xsmall">{nFormatter(deathnoteData.getNextRankReq(deathnoteRank))}</Text>
                                                    </Box>
                                                </Box>

                                            </Box>
                                        </Box>
                                    )
                                })
                            }
                        </ShadowBox>
                    )
                })
            }
        </Box>
    )

}

function ShrinesDisplay() {
    const [cardData, setCardData] = useState<Card[]>();
    const [shrineData, setShrineData] = useState<Shrine[]>([]);
    const appContext = useContext(AppContext);

    useEffect(() => {
        if (appContext) {
            const theData = appContext.data.getData();
            setShrineData(theData.get("shrines"));
            setCardData(theData.get("cards"));
        }
    }, [appContext]);

    const shrineCardBonus = useMemo(() => {
        return cardData?.find(card => card.id == "Boss3B")?.getBonus();
    }, [cardData]);

    if (!shrineData || shrineData.filter(shrine => shrine.level > 0).length == 0) {
        return (
            <Box align="center" pad="medium">
                <Heading level='3'>Come back when you unlocked this!</Heading>
            </Box>
        )
    }
    return (
        <Box gap="medium" pad="large">
            <TextAndLabel
                label="Total Levels"
                text={shrineData.reduce((sum, shrine) => sum += shrine.level, 0).toString()}
            />
            <Box>
                {shrineData && shrineData.filter(shrine => shrine.level > 0).map((shrine, index) => {
                    return (
                        <ShadowBox key={index} background="dark-1" pad="medium" margin={{ bottom: 'small' }}>
                            <Box gap="small">
                                <Box direction="row" align="center">
                                    <Box margin={{ right: 'small' }}>
                                        <IconImage data={shrine.getImageData()} scale={0.7} />
                                    </Box>
                                    <Text>{shrine.name}</Text>
                                </Box>
                                <Box direction="row" justify="between" wrap>
                                    <TextAndLabel
                                        label="Level"
                                        text={shrine.level.toString()}
                                        margin={{ right: 'medium', bottom: 'small' }}
                                    />
                                    <TextAndLabel
                                        label="Current Map"
                                        text={MapInfo[shrine.currentMap].data.map.name}
                                        margin={{ right: 'medium', bottom: 'small' }}
                                    />
                                    <TextAndLabel
                                        label="Hours"
                                        text={`${Math.round(shrine.accumulatedHours)}/${Math.round(shrine.getHourRequirement())}`}
                                        margin={{ right: 'medium', bottom: 'small' }}
                                    />
                                    <TextAndLabel
                                        label="Bonus (without card)"
                                        text={`${nFormatter(shrine.getBonus(shrine.currentMap, 0), "Smaller")}%`}
                                        margin={{ right: 'medium', bottom: 'small' }}
                                    />
                                    <TextAndLabel
                                        label="Bonus (with card)"
                                        text={`${nFormatter(shrine.getBonus(shrine.currentMap, shrineCardBonus), "Smaller")}%`}
                                        margin={{ right: 'medium', bottom: 'small' }}
                                    />
                                </Box>
                            </Box>
                        </ShadowBox>
                    )
                })
                }
            </Box>
        </Box>
    )

}

function Construction() {
    const [activeTab, setActiveTab] = useState<string>("Refinery");

    return (
        <Box>
            <NextSeo title="Construction" />
            <Heading level="2" size="medium" style={{ fontWeight: 'normal' }}>Construction</Heading>
            <Box gap="small">
                <Box align="center" direction="row" justify="center" gap="small">
                    {["Refinery", "Salt Lick", "3D Printer", "Death Note", "Shrines", "Buildings"].map((tabName, index) => (
                        <TabButton key={index} isActive={activeTab == tabName} text={tabName} clickHandler={() => { setActiveTab(tabName); }} />
                    ))
                    }
                </Box>
                {activeTab == "Refinery" && <RefineryDisplay />}
                {activeTab == "Salt Lick" && <SaltLickDisplay />}
                {activeTab == "3D Printer" && <PrinterDisplay />}
                {activeTab == "Death Note" && <DeathnoteDisplay />}
                {activeTab == "Shrines" && <ShrinesDisplay />}
                {activeTab == "Buildings" && <BuildingsDisplay />}
            </Box>
        </Box>
    )
}

export default Construction;