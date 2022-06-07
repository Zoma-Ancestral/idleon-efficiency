import {
    Box,
    Grid,
    Heading,
    Tab,
    Tabs,
    Text,
    ThemeContext,
} from 'grommet'
import { NextSeo } from 'next-seo';
import { useContext, useEffect, useMemo, useState } from 'react';
import IconImage from '../../components/base/IconImage';
import ShadowBox from '../../components/base/ShadowBox';
import TabButton from '../../components/base/TabButton';
import TextAndLabel, { ComponentAndLabel } from '../../components/base/TextAndLabel';
import { TimeDisplaySize, TimeDown } from '../../components/base/TimeDisplay';
import { AppContext } from '../../data/appContext';
import { Breeding as BreedingDomain, petArenaBonuses, waveReqs } from '../../data/domain/breeding';
import { Cooking } from '../../data/domain/cooking';
import { EnemyInfo } from '../../data/domain/enemies';
import { GemStore } from '../../data/domain/gemPurchases';
import { Player } from '../../data/domain/player';
import { ClassIndex, Talent } from '../../data/domain/talents';
import { TaskBoard } from '../../data/domain/tasks';
import { nFormatter } from '../../data/utility';

function TerritoryDisplay() {
    const [breeding, setBreeding] = useState<BreedingDomain>();
    const appContext = useContext(AppContext);

    useEffect(() => {
        if (appContext) {
            const theData = appContext.data.getData();
            setBreeding(theData.get("breeding"));
        }
    }, [appContext]);

    if (!breeding) {
        return (
            <Box>
                Still loading
            </Box>
        )
    }

    return (
        <Box>
            <Text>Territory</Text>
            {
                breeding.territory.filter(territory => territory.unlocked).map((territory, index) => (
                    <ShadowBox background="dark-1" key={index} direction="row" gap="medium" margin={{ bottom: 'medium' }} align="center" pad="small">
                        <Grid columns={["25%", "15%", "15%", "15%"]} fill>
                            <TextAndLabel textSize='small' label="Name" text={territory.data.battleName} />
                            <ComponentAndLabel label="Current Spices" component={
                                <Box direction="row" gap="small" align="center">
                                    <IconImage data={{ location: `CookingSpice${index}`, height: 36, width: 36 }} />
                                    <Text>{nFormatter(territory.currentSpices)}</Text>
                                </Box>
                            } />
                            <TextAndLabel label="Progress" text={`${nFormatter(territory.currentProgress)}/${nFormatter(territory.getTrekReq())}`} />
                            <Box>
                                {
                                    territory.pets.map((pet, index) => {
                                        const enemy = EnemyInfo.find(enemy => enemy.id == pet.name);
                                        return (
                                            <Box key={`pet_${index}`} direction="row" gap="small">
                                                <Text size="xsmall">{enemy?.details.Name} | {pet.gene.data.name} | {nFormatter(pet.power)}</Text>
                                            </Box>
                                        )
                                    })
                                }
                            </Box>
                        </Grid>
                    </ShadowBox>
                ))
            }
        </Box>
    )
}

function PetUpgradeDisplay() {
    const [breeding, setBreeding] = useState<BreedingDomain>();
    const appContext = useContext(AppContext);

    const upgradeCosts = useMemo(() => {
        const cooking = appContext.data.getData().get("cooking") as Cooking;
        if (cooking && breeding) {
            return breeding.upgrade.map(upgrade => {
                const meal = upgrade.data.cost != -1 ? cooking.meals[upgrade.data.cost] : undefined
                const mealCost = meal ? upgrade.getCost(1) : -1;
                return [{
                    image: {
                        location: "PetDeadCell",
                        width: 33,
                        height: 33
                    },
                    name: "Pet Dead Cell",
                    cost: upgrade.getCost(0),
                    canAfford: breeding.deadCells >= upgrade.getCost(0)
                },
                {
                    image: meal?.getImageData(),
                    name: meal?.name,
                    cost: mealCost,
                    canAfford: (meal?.count ?? 0) > mealCost
                }
                ]
            });
        }
        return [];
    }, [breeding])

    useEffect(() => {
        if (appContext) {
            const theData = appContext.data.getData();
            setBreeding(theData.get("breeding"));
        }
    }, [appContext]);

    if (!breeding) {
        return (
            <Box>
                Still loading
            </Box>
        )
    }

    return (<Box>
        <Text>Upgrades</Text>
        {
            breeding.upgrade.filter(upgrade => upgrade.data.upgradeName != "Filler").map((upgrade, index) => (
                <ShadowBox key={index} background="dark-1" margin={{ bottom: 'medium' }} align="center" pad="small">
                    <Grid columns={{ size: 'auto', count: 5 }} fill>
                        <IconImage data={upgrade.getImageData()} scale={0.7} />
                        <TextAndLabel textSize='xsmall' label="Name" text={upgrade.data.upgradeName} />
                        <TextAndLabel textSize='xsmall' label="Bonus" text={upgrade.getBonusText()} />
                        <TextAndLabel textSize='xsmall' label="Level" text={`${upgrade.level}/${upgrade.data.maxLevel}`} />
                        <Box direction="row" gap="small">
                            {
                                upgradeCosts[index].map((cost, index) => (
                                    <Box key={`upg_${index}`} align="center" gap="xsmall">
                                        {
                                            cost.image &&
                                            <IconImage data={cost.image} />
                                        }
                                        {
                                            cost.cost > 0 && <Text color={cost.canAfford ? 'green-1' : ''} size="small">{nFormatter(cost.cost)}</Text>
                                        }
                                    </Box>
                                ))
                            }
                        </Box>
                    </Grid>
                </ShadowBox>
            ))
        }
    </Box>)
}

function ArenaBonusDisplay() {
    const [breeding, setBreeding] = useState<BreedingDomain>();
    const [playerData, setPlayerData] = useState<Player[]>();
    const appContext = useContext(AppContext);

    const beastMasters = useMemo(() => {
        return playerData?.filter(player => (player.classId == ClassIndex.Beast_Master)) ?? [];
    }, [playerData])

    useEffect(() => {
        if (appContext) {
            const theData = appContext.data.getData();
            setBreeding(theData.get("breeding"));
            setPlayerData(theData.get("players"));
        }
    }, [appContext]);

    if (!breeding) {
        return (
            <Box>
                Still loading
            </Box>
        )
    }
    return (
        <Box gap="small">
            <Box direction="row" wrap justify="center" margin={{top: 'small'}}>
                {beastMasters && beastMasters.map((bm, index) => {
                    const [arenaTalent, cooldown] = [...bm.cooldown.entries()].filter(([talent, cooldown]) => talent.skillIndex == 370)?.pop() as [Talent, number];
                    const realCD = cooldown - bm.afkFor;
                    return (
                        <ShadowBox key={index} background="dark-1" pad="medium" align="center" margin={{ right: 'large', bottom: 'small' }}>
                            <Box gap="small">
                                <Box direction="row" gap="small">
                                    <IconImage data={bm.getClassImageData()} />
                                    <Text>{bm.playerName}</Text>
                                </Box>
                                <Box direction="row" gap="small">
                                    <Box style={{ opacity: realCD <= 0 ? 1 : 0.5 }}>
                                        <IconImage data={arenaTalent.getImageData()} scale={0.8} />
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
            <TextAndLabel
                label="Max Arena Wave"
                text={breeding.arenaWave.toString() ?? "Unknown"}
            />
            <Grid columns="1/4" fill>
                {
                    petArenaBonuses.map((bonus, index) => (
                        <ShadowBox style={{ opacity: breeding.hasBonus(index) ? 1 : 0.5 }} background="dark-1" pad="small" key={index} margin={{ right: 'small', bottom: 'small' }}>
                            <TextAndLabel
                                center
                                label={`Wave ${waveReqs[index].toString()}`}
                                labelSize='medium'
                                textSize='xsmall'
                                text={bonus.desc}
                            />
                        </ShadowBox>
                    ))
                }
            </Grid>
        </Box>
    )
}

function EggDisplay() {
    const [breeding, setBreeding] = useState<BreedingDomain>();
    const appContext = useContext(AppContext);

    const capacity = useMemo(() => {
        const theData = appContext.data.getData();
        const gemStore = theData.get("gems") as GemStore;
        const taskBoard = theData.get("taskboard") as TaskBoard;

        if (gemStore && breeding) {
            const eggCapacityUpgrade = gemStore.purchases.find(purchase => purchase.itemName == "Royal Egg Cap")?.pucrhased ?? 0;
            const breedingUpgradeLevel = breeding?.upgrade.find(upgrade => upgrade.data.upgradeName == "Egg Capacity")?.level ?? 0;
            const eggMerit = taskBoard.merits.find(merit => merit.descLine1.includes("egg capacity in the Nest"));
            return 3 + eggCapacityUpgrade + breedingUpgradeLevel + (eggMerit ? eggMerit.level * eggMerit.bonusPerLevel : 0);
        }
        return 0;
    }, [breeding, appContext]);

    useEffect(() => {
        if (appContext) {
            const theData = appContext.data.getData();
            setBreeding(theData.get("breeding"));
        }
    }, [appContext]);

    if (!breeding) {
        return (
            <Box>
                Still loading
            </Box>
        )
    }

    if (breeding.territory.filter(territory => territory.unlocked).length == 0) {
        return null;
    }

    return (
        <Box gap="small">
            <Text size="xsmall">* New eggs will only show up after the cloud save updates.</Text>
            <Box direction="row" gap="medium">
                <Box direction="row" align="center">
                    {
                        [...Array(capacity)].map((_, index) => {
                            if (breeding.eggs.length < index) {
                                return;
                            }
                            return (
                                <Box key={`egg_${index}`} border={{ color: 'grey-1', side: 'all', size: '2px' }} align="center">
                                    {
                                        breeding.eggs[index]?.rarity ?? 0 > 0 ?
                                            <Box key={index}>
                                                <IconImage data={breeding.eggs[index].getImageData()} />
                                            </Box>
                                            :
                                            <Box height="43px" width="38px" />
                                    }
                                </Box>
                            )
                        })
                    }
                </Box>
                <ComponentAndLabel label="Next Egg In" component={<TimeDown addSeconds={breeding.totalEggTime - breeding.timeTillEgg} />} />
                {
                    breeding.getStatRange().map((stat, index) => (
                        <TextAndLabel label={index == 0 ? "Min Stat" : "Max Stat"} text={nFormatter(stat)} key={index} />
                    ))
                }
                <ComponentAndLabel label="Dead Cells" component={
                    <Box direction="row" gap="small" align="center">
                        <Text>{nFormatter(breeding.deadCells)}</Text>
                        <IconImage data={{ location: 'PetDeadCell', height: 25, width: 25 }} />
                    </Box>
                } />

            </Box>
        </Box>
    )
}

function Breeding() {
    const [activeTab, setActiveTab] = useState<string>("Territory");
    return (
        <Box>
            <NextSeo title="Breeding" />
            <Heading level="2" size="medium" style={{ fontWeight: 'normal' }}>Breeding</Heading>
            <Text size="xsmall">* This is a work in progress, there could some bugs and minor inaccuracies.</Text>
            <Box pad="small">
                <EggDisplay />
            </Box>
            <Box align="center" direction="row" justify="center" gap="small">
                {["Territory", "Upgrades", "Arena"].map((tabName, index) => (
                    <TabButton key={index} isActive={activeTab == tabName} text={tabName} clickHandler={() => { setActiveTab(tabName); }} />
                ))
                }
            </Box>
            {activeTab == "Arena" && <ArenaBonusDisplay />}
            {activeTab == "Upgrades" && <PetUpgradeDisplay />}
            {activeTab == "Territory" && <TerritoryDisplay />}
        </Box>
    )
}

export default Breeding;