import {
    Box,
    Table,
    TableHeader,
    TableRow,
    TableBody,
    TableCell,
    Heading,
    Text,
    Grid,
    ResponsiveContext,
    Stack,
    Meter
} from 'grommet'
import { useContext } from 'react';
import { AppContext } from '../../data/appContext'
import { NextSeo } from 'next-seo';

import ShadowBox from '../../components/base/ShadowBox';

import { Equinox as EquinoxDomain, isFoodLust } from '../../data/domain/equinox';

function Equinox() {
    const appContext = useContext(AppContext);

    const theData = appContext.data.getData();
    const equinox = theData.get("equinox") as EquinoxDomain;

    if (!equinox) {
        return <></>
    }

    return (
        <Box>
            <NextSeo title="Equinox" />
            <Heading level="2" size="medium" style={{ fontWeight: 'normal' }}>Equinox</Heading>
            <Box direction="row" gap="small">
                <Stack>
                    <Meter
                        size="small"
                        type="bar"
                        background="accent-3"
                        color="brand"
                        values={[
                            {
                                value: equinox.bar.current,
                                label: 'current',
                                color: 'brand'
                            }
                        ]}
                        max={equinox.bar.max} />
                    <Box align="center" pad="xxsmall">
                        <Text size="small">{Math.floor(equinox.bar.current).toString()} ({equinox.bar.percentageOfCap}%)</Text>
                    </Box>
                </Stack>
                <Text size="xsmall">{equinox.bar.max}</Text>
                <Text size="small">Fill rate: {equinox.bar.rate}/hr</Text>
            </Box>
            <Box pad="large" gap="small">
                {
                    equinox.activeChallenges.length > 0 &&
                    <Box margin={{ bottom: 'medium' }} gap="medium">
                        <Text size="large">Active Challenges</Text>

                        <Box direction="row" wrap>
                            {
                                equinox.activeChallenges.map((challenge, index) => (
                                    <ShadowBox width={"200px"} key={index} background="dark-1" margin={{ right: 'small', bottom: 'small' }} pad="medium">
                                        <Text size="small">{challenge.data.challenge}</Text>
                                        <Text size="small">{challenge.data.reward}</Text>
                                    </ShadowBox>
                                ))
                            }
                        </Box>
                    </Box>
                }
                <Box>
                    <Text size="large">Upgrades</Text>
                    <Box direction="row" wrap margin={{ top: 'large' }}>
                        <Grid columns={{ size: 'auto', count: 4 }} fill>
                            {
                                equinox.upgrades.map((upgrade, index) => {
                                    const foodLust = isFoodLust(upgrade);
                                    const border = foodLust ? { color: 'green-1', size: '1px'} : undefined
                                    return (
                                        <ShadowBox border={border} style={{ opacity: upgrade.unlocked ? 1 : 0.5}} key={index} background="dark-1" margin={{ right: 'small', bottom: 'small' }} pad="medium" gap="medium">
                                            <Text>{upgrade.data.name} ({upgrade.level}/{upgrade.maxLevel})</Text>
                                            <Text size="xsmall">{upgrade.getDescription()}</Text>
                                            {upgrade.getBonus() != -1 && <Text size="xsmall">{upgrade.getBonusText()}</Text>}
                                        </ShadowBox>
                                    )
                                })

                            }
                        </Grid>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export default Equinox;