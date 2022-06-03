import { StampDescriptionModel } from '../model/stampDescriptionModel';

export class StampDescriptionBase { constructor(public id: string, public data: StampDescriptionModel) { } }



export const initStampDescriptionRepo = () => {
    return [    
        new StampDescriptionBase("Combat Stamp", <StampDescriptionModel>{
                "descriptions": [
                    "+{ Base Damage",
                    "+{ Base HP",
                    "+{ Base MP",
                    "+{% Total Damage",
                    "+{ Base Accuracy",
                    "+{ Base Defence",
                    "+{ Base Damage",
                    "+{% Critical Damage",
                    "+{ STR",
                    "+{% Total Damage",
                    "+{ AGI",
                    "+{ Base HP",
                    "+{ WIS",
                    "+{ Base MP",
                    "+{ LUK",
                    "+{ Base Damage",
                    "+{ Base Accuracy.",
                    "+{% Movement Speed",
                    "+{% Total Damage",
                    "+{ STR",
                    "+{ Base Defence",
                    "+{ AGI",
                    "+{% Damage Toward Bosses",
                    "+{ WIS",
                    "+{ Base Damage",
                    "+{% Total Damage. Also grats on 1 million followers!",
                    "+{ LUK",
                    "+{ All Stats. ''All Stats'' means STR, AGI, WIS, and LUK",
                    "+{ Base Damage",
                    "+{% Total Damage",
                    "+{ Base Accuracy",
                    "+{ Base HP"
                ]
            }),
        new StampDescriptionBase("Skills Stamp", <StampDescriptionModel>{
                "descriptions": [
                    "+{ Base Mining Efficiency",
                    "+{ Base Choppin' Efficiency",
                    "+{% Anvil Production Speed. This affects the 'Produce' tab within the anvil.",
                    "+{% Carrying Capacity for Mining Items",
                    "+{% Multi-Ore Chance",
                    "+{% Carrying Capacity for Choppin' Items",
                    "+{% Multi-Log Chance",
                    "+{% Carrying Capacity for Material Items",
                    "+{% Mining Exp Gain",
                    "+{ Base Mining Efficicency",
                    "+{% Choppin Exp Gain",
                    "+{ Base Choppin' Efficiency",
                    "+{% Alchemy Speed",
                    "+{% Alchemy Exp Gain",
                    "+{% Liquid Regen Speed in Alchemy",
                    "+{ Cap for all Liquids in Alchemy",
                    "+{ Base Fishing Efficiency",
                    "+{% Fishing Exp Gain",
                    "+{ Base Catching Efficiency",
                    "+{% Catching Exp Gain",
                    "+{% Carry Capacity for Fishing Items",
                    "+{% Multi-Fish Chance",
                    "+{% Carry Capacity for Catching Items",
                    "+{% Mutli-Bug Chance",
                    "+{ Base Trapping Efficiency",
                    "+{% Shiny Catch rate, multiplier",
                    "+{% Trapping Exp Gain",
                    "+{% Shiny Catch rate, multiplier",
                    "+{% Building Speed",
                    "+{% 3D Printer Sampling Size",
                    "+{% Construction Exp Gain",
                    "+{% 3D Printer Sampling Size",
                    "+{ Base Worship Efficiency",
                    "+{% Charge Rate per Hour, multiplier",
                    "+{% Max Charge",
                    "+{ Starting Points in Worship Tower Defense",
                    "+{% Meal Cooking Speed",
                    "+{% New Recipe Cooking Speed",
                    "+{ Cooking Efficiency",
                    "+{% Breeding EXP Gain",
                    "+{% New Pet Chance",
                    "+{% Lab Exp Gain"
                ]
            }),
        new StampDescriptionBase("Misc Stamp", <StampDescriptionModel>{
                "descriptions": [
                    "+{% Quest Exp",
                    "+{% Carry Capacity for ALL item types!",
                    "+{% Crystal Monster Spawn Chance",
                    "+{% Arcade Ball recharge rate",
                    "+{% reduced golden ball cost for upgrades",
                    "+{% Effect from Boost Food, like Potions and stuff, like, such as!",
                    "+{% Effect from Golden Food. Sparkle sparkle!",
                    "+{hr Arcade Ball claim max time",
                    "+{% Card Drop Rate. Go get them cards boy-o!",
                    "+{",
                    "+{",
                    "+{",
                    "+{ Talent Points for Tab 1",
                    "+{ Talent Points for Tab 2",
                    "+{ Talent Points for Tab 3",
                    "+{ Talent Points for Tab 4",
                    "+{ Talent Points for Tab 5",
                    "+{ Talent Points for Star Tab",
                    "+{% Base Multikill Rate, for all worlds.",
                    "+{% Talent Book Library Refresh Speed",
                    "+{% DNA gained from Splicing"
                ]
            })    
]
}
