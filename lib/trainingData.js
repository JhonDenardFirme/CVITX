// lib/documentation-data.js

// 25 x-axis labels (the chart builds B-01..C-25 internally; we keep this for reference)
export const TRAINING_LABELS_25 = Array.from({ length: 25 }, (_, i) => String(i + 1));

export const METRIC_TEXT = {
  type: "Classification score for coarse vehicle type (e.g., Car, SUV, Jeepney). Higher is better; reflects normalized accuracy/F1.",
  make: "Classification score for manufacturer (Make). Higher means better recognition under varying views.",
  model: "Fine-grained model identification score. Higher indicates better discriminability between close siblings.",
  vbox: "Regression quality for the whole-vehicle bounding box (normalized IoU/quality proxy). Higher is better.",
  pbox: "Aggregate part bounding box quality (normalized). Higher means more precise localizations under occlusion.",
};

// Phase images (6 per phase; swap with real assets later)
const IMG = (phaseKey, idx) => `/training/phase-samples/${phaseKey}-${String(idx).padStart(2, "0")}.jpg`;

export const PHASES = [
  {
    key: "phase-1",
    nav: "Phase 1",
    title: "PHASE 1 — Coarse Type",
    intro:
      "Phase 1 focuses on coarse vehicle type recognition. Baseline uses standard supervision. CMT introduces compositional masking to encourage resilience to missing or obscured parts.",
    images: [IMG("phase-1", 1), IMG("phase-1", 2), IMG("phase-1", 3), IMG("phase-1", 4), IMG("phase-1", 5), IMG("phase-1", 6)],
    metrics: [
      {
        key: "type", label: "Type (score)", desc: "Classification score for Coarse vehicle type (e.g., Car, SUV, Jeepney).", caption: "Higher Value = Higher Accuracy of Classifying Vehicle Type",
        pair: {
          baseline: [
            0.3490, 0.7050, 0.8220, 0.7910, 0.8290,
            0.9150, 0.9150, 0.9300, 0.9300, 0.9150,
            0.9380, 0.9070, 0.9300, 0.9150, 0.9300,
            0.9300, 0.9380, 0.9380, 0.9300, 0.9380,
            0.9380, 0.9300, 0.9220, 0.9300, 0.9380
          ],
          cmt: [
            0.1200, 0.1427, 0.1661, 0.1899, 0.2136,
            0.2369, 0.2609, 0.2849, 0.3088, 0.3324,
            0.3563, 0.3801, 0.4039, 0.4277, 0.4514,
            0.4751, 0.4989, 0.5226, 0.5463, 0.5701,
            0.5938, 0.6175, 0.6413, 0.6650, 0.6888
          ]
        },
      },
      {
        key: "make", label: "Make (score)", desc: "Classification score for manufacturer (Make). Not implemented in Phase 1", caption: "Higher Value = More Precise Localization",
        pair: {
          baseline: [
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000
          ],
          cmt: [
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000
          ]
        },
      },
      {
        key: "model", label: "Model (score)", desc: "Fine-grained model identification score. Not implemented in PHase 1", caption: "Higher Value = More Precise Localization",
        pair: {
          baseline: [
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000
          ],
          cmt: [
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000
          ]
        },
      },
      {
        key: "vbox", label: "Vehicle Box (score)", desc: "Regression quality for the whole-vehicle bounding box (normalized IoU/quality proxy)", caption: "Higher Value = More Precise Localization",
        pair: {
          baseline: [
            0.4390, 0.5000, 0.5480, 0.5860, 0.6240,
            0.6460, 0.6690, 0.6910, 0.7070, 0.7260,
            0.7380, 0.7520, 0.7490, 0.7590, 0.7710,
            0.7670, 0.7810, 0.7970, 0.7930, 0.8010,
            0.8160, 0.8110, 0.8240, 0.8210, 0.8400
          ],
          cmt: [
            0.1650, 0.1820, 0.1992, 0.2164, 0.2335,
            0.2507, 0.2678, 0.2850, 0.3022, 0.3193,
            0.3365, 0.3537, 0.3708, 0.3880, 0.4051,
            0.4223, 0.4395, 0.4566, 0.4738, 0.4910,
            0.5081, 0.5253, 0.5424, 0.5596, 0.5768
          ]
        },
      }, 
      {
        key: "pbox", label: "Parts Box Score", desc: "Aggregate part bounding box quality (normalized)", caption: "Higher Value = More Precise Localization",
        pair: {
          baseline: [
            0.4390, 0.5030, 0.5480, 0.5760, 0.6080,
            0.5990, 0.6300, 0.6220, 0.6530, 0.6450,
            0.6750, 0.6890, 0.6820, 0.7080, 0.7300,
            0.7520, 0.7760, 0.8040, 0.8080, 0.8120,
            0.8160, 0.8200, 0.8260, 0.8330, 0.8400
          ],
          cmt: [
            0.1030, 0.1224, 0.1416, 0.1608, 0.1801,
            0.1993, 0.2185, 0.2377, 0.2569, 0.2761,
            0.2954, 0.3146, 0.3338, 0.3530, 0.3722,
            0.3914, 0.4106, 0.4298, 0.4490, 0.4682,
            0.4874, 0.5066, 0.5258, 0.5450, 0.5642
          ]
        },
      },
    ],
    analysis: {
      title: "Analysis of the visualizations",
      subtitle: "Baseline vs CMT progression in early-stage learning.",
      paragraphs: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat, massa sit amet hendrerit euismod, nibh dolor pharetra magna, a hendrerit nunc augue non est. Curabitur semper urna augue, quis aliquet lacus rutrum vitae.",
        "Suspendisse potenti. Cras ac tincidunt nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin id nisi sit amet augue interdum consectetur. Phasellus id nisi sit amet massa iaculis elementum.",
        "Duis vulputate magna sit amet purus rutrum, non tempor arcu eleifend. In hendrerit lectus leo, at vulputate mi porta eget. Vivamus et consequat augue, sit amet feugiat arcu. Maecenas vehicula, magna in lacinia iaculis, urna lorem dictum mi, vel pellentesque sem ante id mi."
      ],
    },
  },
  {
    key: "phase-2",
    nav: "Phase 2",
    title: "PHASE 2 — Make (Frontal Emphasis)",
    intro:
      "Phase 2 emphasizes frontal cues (logo, grille, headlights) to improve manufacturer recognition while building on Phase 1 foundations.",
    images: [IMG("phase-2", 1), IMG("phase-2", 2), IMG("phase-2", 3), IMG("phase-2", 4), IMG("phase-2", 5), IMG("phase-2", 6)],
    metrics: [
      {
        key: "type", label: "Type (score)", desc: "Classification score for coarse vehicle type (e.g., Car, SUV, Jeepney). Higher is better; reflects normalized accuracy/F1.",
        pair: {
          baseline: [
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000
          ],
          cmt: [
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000
          ]
        },
      },
      {
        key: "make", label: "Make (score)", desc: "Classification score for manufacturer (Make). Higher means better recognition under varying views.",
        pair: {
          baseline: [
            0.6150, 0.8280, 0.9080, 0.9200, 0.9080,
            0.8850, 0.9310, 0.8850, 0.9080, 0.9080,
            0.8970, 0.9080, 0.9080, 0.8970, 0.9080,
            0.9080, 0.9200, 0.9310, 0.9200, 0.9080,
            0.8970, 0.8970, 0.8970, 0.9310, 0.9080
          ],
          cmt: [
            0.0950, 0.1125, 0.1302, 0.1479, 0.1656,
            0.1833, 0.2010, 0.2187, 0.2364, 0.2541,
            0.2718, 0.2895, 0.3072, 0.3249, 0.3426,
            0.3603, 0.3780, 0.3957, 0.4134, 0.4311,
            0.4488, 0.4665, 0.4842, 0.5019, 0.5196
          ]
        },
      },
      {
        key: "model", label: "Model (score)", desc: "Fine-grained model identification score. Higher indicates better discriminability between close siblings.",
        pair: {
          baseline: [
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000
          ],
          cmt: [
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
            0.0000, 0.0000, 0.0000, 0.0000, 0.0000
          ]
        },
      },
      {
        key: "vbox", label: "Vehicle Box (score)", desc: "Regression quality for the whole-vehicle bounding box (normalized IoU/quality proxy). Higher is better.",
        pair: {
          baseline: [
            0.7590, 0.7170, 0.7880, 0.7970, 0.8180,
            0.8270, 0.8300, 0.8450, 0.8350, 0.8370,
            0.8560, 0.8500, 0.8540, 0.8600, 0.8600,
            0.8460, 0.8690, 0.8620, 0.8650, 0.8670,
            0.8670, 0.8650, 0.8650, 0.8660, 0.8680
          ],
          cmt: [
            0.1450, 0.1605, 0.1760, 0.1915, 0.2070,
            0.2225, 0.2380, 0.2535, 0.2690, 0.2845,
            0.3000, 0.3155, 0.3310, 0.3465, 0.3620,
            0.3775, 0.3930, 0.4085, 0.4240, 0.4395,
            0.4550, 0.4705, 0.4860, 0.5015, 0.5170
          ]
        },
      },
      {
        key: "pbox", label: "Parts Box (score)", desc: "Aggregate part bounding box quality (normalized). Higher means more precise localizations under occlusion.",
        pair: {
          baseline: [
            0.7480, 0.7700, 0.7900, 0.8040, 0.8160,
            0.8280, 0.8350, 0.8420, 0.8380, 0.8450,
            0.8530, 0.8500, 0.8580, 0.8620, 0.8660,
            0.8710, 0.8750, 0.8780, 0.8820, 0.8840,
            0.8860, 0.8870, 0.8880, 0.8890, 0.8900
          ],
          cmt: [
            0.1030, 0.1208, 0.1386, 0.1564, 0.1742,
            0.1920, 0.2098, 0.2276, 0.2454, 0.2632,
            0.2810, 0.2988, 0.3166, 0.3344, 0.3522,
            0.3700, 0.3878, 0.4056, 0.4234, 0.4412,
            0.4590, 0.4768, 0.4946, 0.5124, 0.5302
          ]
        },
      },
    ],
    analysis: {
      title: "Analysis of the visualizations",
      subtitle: "Make recognition gains under frontal emphasis and masking.",
      paragraphs: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat, massa sit amet hendrerit euismod, nibh dolor pharetra magna, a hendrerit nunc augue non est. Curabitur semper urna augue, quis aliquet lacus rutrum vitae.",
        "Suspendisse potenti. Cras ac tincidunt nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin id nisi sit amet augue interdum consectetur. Phasellus id nisi sit amet massa iaculis elementum.",
        "Duis vulputate magna sit amet purus rutrum, non tempor arcu eleifend. In hendrerit lectus leo, at vulputate mi porta eget. Vivamus et consequat augue, sit amet feugiat arcu. Maecenas vehicula, magna in lacinia iaculis, urna lorem dictum mi, vel pellentesque sem ante id mi."
      ],
    },
  },
  {
    key: "phase-3",
    nav: "Phase 3",
    title: "PHASE 3 — Full Make–Model (Controlled)",
    intro:
      "Phase 3 targets detailed make–model classification under controlled datasets before adaptation to street-level conditions.",
    images: [IMG("phase-3", 1), IMG("phase-3", 2), IMG("phase-3", 3), IMG("phase-3", 4), IMG("phase-3", 5), IMG("phase-3", 6)],
    metrics: [
      {
        key: "type", label: "Type (score)", desc: "Classification score for coarse vehicle type (e.g., Car, SUV, Jeepney). Higher is better; reflects normalized accuracy/F1.",
        pair: {
          baseline: [
            0.7820, 0.9390, 0.9560, 0.9260, 0.9190,
            0.9660, 0.9430, 0.9630, 0.9700, 0.9660,
            0.9630, 0.9700, 0.9660, 0.9660, 0.9730,
            0.9630, 0.9630, 0.9700, 0.9660, 0.9730,
            0.9700, 0.9700, 0.9660, 0.9700, 0.9660
          ],
          cmt: [
            0.1400, 0.1581, 0.1764, 0.1947, 0.2130,
            0.2313, 0.2496, 0.2679, 0.2862, 0.3045,
            0.3228, 0.3411, 0.3594, 0.3777, 0.3960,
            0.4143, 0.4326, 0.4509, 0.4692, 0.4875,
            0.5058, 0.5241, 0.5424, 0.5607, 0.5790
          ]
        },
      },
      {
        key: "make", label: "Make (score)", desc: "Classification score for manufacturer (Make). Higher means better recognition under varying views.",
        pair: {
          baseline: [
            0.7840, 0.8180, 0.8210, 0.8480, 0.8410,
            0.8720, 0.8480, 0.8720, 0.8820, 0.8410,
            0.8550, 0.8650, 0.8650, 0.8650, 0.8850,
            0.8920, 0.8890, 0.8920, 0.8890, 0.8820,
            0.8920, 0.8890, 0.8920, 0.8820, 0.8790
          ],
          cmt: [
            0.1300, 0.1474, 0.1651, 0.1826, 0.2001,
            0.2176, 0.2351, 0.2526, 0.2701, 0.2876,
            0.3051, 0.3226, 0.3401, 0.3576, 0.3751,
            0.3926, 0.4101, 0.4276, 0.4451, 0.4626,
            0.4801, 0.4976, 0.5151, 0.5326, 0.5501
          ]
        },
      },
      {
        key: "model", label: "Model (score)", desc: "Fine-grained model identification score. Higher indicates better discriminability between close siblings.",
        pair: {
          baseline: [
            0.4570, 0.6760, 0.7230, 0.7470, 0.6860,
            0.7370, 0.7370, 0.7880, 0.8280, 0.8310,
            0.8410, 0.8040, 0.8310, 0.8350, 0.8280,
            0.8520, 0.8410, 0.8620, 0.8520, 0.8580,
            0.8580, 0.8480, 0.8520, 0.8550, 0.8620
          ],
          cmt: [
            0.1600, 0.1775, 0.1952, 0.2129, 0.2306,
            0.2483, 0.2660, 0.2837, 0.3014, 0.3191,
            0.3368, 0.3545, 0.3722, 0.3899, 0.4076,
            0.4253, 0.4430, 0.4607, 0.4784, 0.4961,
            0.5138, 0.5315, 0.5492, 0.5669, 0.5846
          ]
        },
      },
      {
        key: "vbox", label: "Vehicle Box (score)", desc: "Regression quality for the whole-vehicle bounding box (normalized IoU/quality proxy). Higher is better.",
        pair: {
          baseline: [
            0.7600, 0.7800, 0.7790, 0.7820, 0.7840,
            0.7350, 0.7790, 0.7910, 0.7980, 0.8180,
            0.8230, 0.8280, 0.8250, 0.8410, 0.8430,
            0.8480, 0.8440, 0.8490, 0.8510, 0.8490,
            0.8520, 0.8500, 0.8520, 0.8540, 0.8540
          ],
          cmt: [
            0.1850, 0.2006, 0.2163, 0.2319, 0.2476,
            0.2632, 0.2789, 0.2945, 0.3102, 0.3258,
            0.3415, 0.3571, 0.3728, 0.3884, 0.4041,
            0.4197, 0.4354, 0.4510, 0.4667, 0.4823,
            0.4980, 0.5136, 0.5293, 0.5449, 0.5606
          ]
        },
      },
      {
        key: "pbox", label: "Parts Box (score)", desc: "Aggregate part bounding box quality (normalized). Higher means more precise localizations under occlusion.",
        pair: {
          baseline: [
            72.4, 73.1, 74.0, 74.8, 75.6,
            76.7, 77.5, 78.9, 78.1, 79.3,
            80.2, 81.1, 82.0, 82.8, 83.4,
            84.1, 83.7, 84.9, 85.6, 86.2,
            86.8, 87.3, 86.9, 88.2, 88.8
          ],
          cmt: [
            0.1330, 0.1507, 0.1685, 0.1862, 0.2039,
            0.2216, 0.2393, 0.2570, 0.2747, 0.2924,
            0.3101, 0.3278, 0.3455, 0.3632, 0.3809,
            0.3986, 0.4163, 0.4340, 0.4517, 0.4694,
            0.4871, 0.5048, 0.5225, 0.5402, 0.5579
          ]
        },
      },
    ],
    analysis: {
      title: "Analysis of the visualizations",
      subtitle: "Fine-grained separation trends and stability under CMT.",
      paragraphs: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat, massa sit amet hendrerit euismod, nibh dolor pharetra magna, a hendrerit nunc augue non est. Curabitur semper urna augue, quis aliquet lacus rutrum vitae.",
        "Suspendisse potenti. Cras ac tincidunt nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin id nisi sit amet augue interdum consectetur. Phasellus id nisi sit amet massa iaculis elementum.",
        "Duis vulputate magna sit amet purus rutrum, non tempor arcu eleifend. In hendrerit lectus leo, at vulputate mi porta eget. Vivamus et consequat augue, sit amet feugiat arcu. Maecenas vehicula, magna in lacinia iaculis, urna lorem dictum mi, vel pellentesque sem ante id mi."
      ],
    },
  },
  {
    key: "phase-4",
    nav: "Phase 4",
    title: "PHASE 4 — Street-Level (Single Vehicle)",
    intro:
      "Phase 4 adapts to real-world street frames with one vehicle per scene, introducing background clutter and mild occlusion.",
    images: [IMG("phase-4", 1), IMG("phase-4", 2), IMG("phase-4", 3), IMG("phase-4", 4), IMG("phase-4", 5), IMG("phase-4", 6)],
    metrics: [
      {
        key: "type", label: "Type (score)", desc: "Classification score for coarse vehicle type (e.g., Car, SUV, Jeepney). Higher is better; reflects normalized accuracy/F1.",
        pair: {
          baseline: [
            0.1100, 0.1258, 0.1416, 0.1574, 0.1732,
            0.1890, 0.2048, 0.2206, 0.2364, 0.2522,
            0.2680, 0.2838, 0.2996, 0.3154, 0.3312,
            0.3470, 0.3628, 0.3786, 0.3944, 0.4102,
            0.4260, 0.4418, 0.4576, 0.4734, 0.4892
          ],
          cmt: [
            0.1480, 0.1644, 0.1810, 0.1975, 0.2141,
            0.2306, 0.2472, 0.2637, 0.2803, 0.2968,
            0.3134, 0.3299, 0.3465, 0.3630, 0.3796,
            0.3961, 0.4127, 0.4292, 0.4458, 0.4623,
            0.4789, 0.4954, 0.5120, 0.5285, 0.5451
          ]
        },
      },
      {
        key: "make", label: "Make (score)", desc: "Classification score for manufacturer (Make). Higher means better recognition under varying views.",
        pair: {
          baseline: [
            0.0950, 0.1104, 0.1257, 0.1411, 0.1564,
            0.1718, 0.1871, 0.2025, 0.2178, 0.2332,
            0.2485, 0.2639, 0.2792, 0.2946, 0.3099,
            0.3253, 0.3406, 0.3560, 0.3713, 0.3867,
            0.4020, 0.4174, 0.4327, 0.4481, 0.4634
          ],
          cmt: [
            0.1330, 0.1491, 0.1652, 0.1813, 0.1974,
            0.2135, 0.2296, 0.2457, 0.2618, 0.2779,
            0.2940, 0.3101, 0.3262, 0.3423, 0.3584,
            0.3745, 0.3906, 0.4067, 0.4228, 0.4389,
            0.4550, 0.4711, 0.4872, 0.5033, 0.5194
          ]
        },
      },
      {
        key: "model", label: "Model (score)", desc: "Fine-grained model identification score. Higher indicates better discriminability between close siblings.",
        pair: {
          baseline: [
            0.1300, 0.1451, 0.1602, 0.1753, 0.1904,
            0.2055, 0.2206, 0.2357, 0.2508, 0.2659,
            0.2810, 0.2961, 0.3112, 0.3263, 0.3414,
            0.3565, 0.3716, 0.3867, 0.4018, 0.4169,
            0.4320, 0.4471, 0.4622, 0.4773, 0.4924
          ],
          cmt: [
            0.1680, 0.1846, 0.2013, 0.2179, 0.2345,
            0.2512, 0.2678, 0.2844, 0.3011, 0.3177,
            0.3343, 0.3510, 0.3676, 0.3842, 0.4009,
            0.4175, 0.4341, 0.4508, 0.4674, 0.4840,
            0.5007, 0.5173, 0.5339, 0.5506, 0.5672
          ]
        },
      },
      {
        key: "vbox", label: "Vehicle Box (score)", desc: "Regression quality for the whole-vehicle bounding box (normalized IoU/quality proxy). Higher is better.",
        pair: {
          baseline: [
            0.1600, 0.1738, 0.1876, 0.2014, 0.2152,
            0.2290, 0.2428, 0.2566, 0.2704, 0.2842,
            0.2980, 0.3118, 0.3256, 0.3394, 0.3532,
            0.3670, 0.3808, 0.3946, 0.4084, 0.4222,
            0.4360, 0.4498, 0.4636, 0.4774, 0.4912
          ],
          cmt: [
            0.1980, 0.2124, 0.2268, 0.2412, 0.2556,
            0.2700, 0.2844, 0.2988, 0.3132, 0.3276,
            0.3420, 0.3564, 0.3708, 0.3852, 0.3996,
            0.4140, 0.4284, 0.4428, 0.4572, 0.4716,
            0.4860, 0.5004, 0.5148, 0.5292, 0.5436
          ]
        },
      },
      {
        key: "pbox", label: "Parts Box (score)", desc: "Aggregate part bounding box quality (normalized). Higher means more precise localizations under occlusion.",
        pair: {
          baseline: [
            0.0800, 0.0953, 0.1106, 0.1259, 0.1412,
            0.1565, 0.1718, 0.1871, 0.2024, 0.2177,
            0.2330, 0.2483, 0.2636, 0.2789, 0.2942,
            0.3095, 0.3248, 0.3401, 0.3554, 0.3707,
            0.3860, 0.4013, 0.4166, 0.4319, 0.4472
          ],
          cmt: [
            0.1280, 0.1449, 0.1618, 0.1787, 0.1956,
            0.2125, 0.2294, 0.2463, 0.2632, 0.2801,
            0.2970, 0.3139, 0.3308, 0.3477, 0.3646,
            0.3815, 0.3984, 0.4153, 0.4322, 0.4491,
            0.4660, 0.4829, 0.4998, 0.5167, 0.5336
          ]
        },
      },
    ],
    analysis: {
      title: "Analysis of the visualizations",
      subtitle: "Domain shift behavior and robustness effects.",
      paragraphs: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat, massa sit amet hendrerit euismod, nibh dolor pharetra magna, a hendrerit nunc augue non est. Curabitur semper urna augue, quis aliquet lacus rutrum vitae.",
        "Suspendisse potenti. Cras ac tincidunt nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin id nisi sit amet augue interdum consectetur. Phasellus id nisi sit amet massa iaculis elementum.",
        "Duis vulputate magna sit amet purus rutrum, non tempor arcu eleifend. In hendrerit lectus leo, at vulputate mi porta eget. Vivamus et consequat augue, sit amet feugiat arcu. Maecenas vehicula, magna in lacinia iaculis, urna lorem dictum mi, vel pellentesque sem ante id mi."
      ],
    },
  },
  {
    key: "phase-5",
    nav: "Phase 5",
    title: "PHASE 5 — Street-Level (Multi-Vehicle)",
    intro:
      "Phase 5 handles multi-vehicle scenes and heavier occlusions, strengthening part aggregation and voting stability.",
    images: [IMG("phase-5", 1), IMG("phase-5", 2), IMG("phase-5", 3), IMG("phase-5", 4), IMG("phase-5", 5), IMG("phase-5", 6)],
    metrics: [
      {
        key: "type", label: "Type (score)", desc: "Classification score for coarse vehicle type (e.g., Car, SUV, Jeepney). Higher is better; reflects normalized accuracy/F1.",
        pair: {
          baseline: [
            0.0850, 0.1028, 0.1206, 0.1384, 0.1562,
            0.1740, 0.1918, 0.2096, 0.2274, 0.2452,
            0.2630, 0.2808, 0.2986, 0.3164, 0.3342,
            0.3520, 0.3698, 0.3876, 0.4054, 0.4232,
            0.4410, 0.4588, 0.4766, 0.4944, 0.5122
          ],
          cmt: [
            0.1330, 0.1520, 0.1712, 0.1904, 0.2096,
            0.2288, 0.2480, 0.2672, 0.2864, 0.3056,
            0.3248, 0.3440, 0.3632, 0.3824, 0.4016,
            0.4208, 0.4400, 0.4592, 0.4784, 0.4976,
            0.5168, 0.5360, 0.5552, 0.5744, 0.5936
          ]
        },
      },
      {
        key: "make", label: "Make (score)", desc: "Classification score for manufacturer (Make). Higher means better recognition under varying views.",
        pair: {
          baseline: [
            0.0700, 0.0879, 0.1058, 0.1237, 0.1416,
            0.1595, 0.1774, 0.1953, 0.2132, 0.2311,
            0.2490, 0.2669, 0.2848, 0.3027, 0.3206,
            0.3385, 0.3564, 0.3743, 0.3922, 0.4101,
            0.4280, 0.4459, 0.4638, 0.4817, 0.4996
          ],
          cmt: [
            0.1180, 0.1367, 0.1555, 0.1742, 0.1929,
            0.2116, 0.2303, 0.2490, 0.2677, 0.2864,
            0.3051, 0.3238, 0.3425, 0.3612, 0.3799,
            0.3986, 0.4173, 0.4360, 0.4547, 0.4734,
            0.4921, 0.5108, 0.5295, 0.5482, 0.5669
          ]
        },
      },
      {
        key: "model", label: "Model (score)", desc: "Fine-grained model identification score. Higher indicates better discriminability between close siblings.",
        pair: {
          baseline: [
            0.1050, 0.1221, 0.1392, 0.1563, 0.1734,
            0.1905, 0.2076, 0.2247, 0.2418, 0.2589,
            0.2760, 0.2931, 0.3102, 0.3273, 0.3444,
            0.3615, 0.3786, 0.3957, 0.4128, 0.4299,
            0.4470, 0.4641, 0.4812, 0.4983, 0.5154
          ],
          cmt: [
            0.1530, 0.1712, 0.1895, 0.2077, 0.2260,
            0.2442, 0.2625, 0.2807, 0.2990, 0.3172,
            0.3355, 0.3537, 0.3720, 0.3902, 0.4085,
            0.4267, 0.4450, 0.4632, 0.4815, 0.4997,
            0.5180, 0.5362, 0.5545, 0.5727, 0.5910
          ]
        },
      },
      {
        key: "vbox", label: "Vehicle Box (score)", desc: "Regression quality for the whole-vehicle bounding box (normalized IoU/quality proxy). Higher is better.",
        pair: {
          baseline: [
            0.1400, 0.1547, 0.1694, 0.1841, 0.1988,
            0.2135, 0.2282, 0.2429, 0.2576, 0.2723,
            0.2870, 0.3017, 0.3164, 0.3311, 0.3458,
            0.3605, 0.3752, 0.3899, 0.4046, 0.4193,
            0.4340, 0.4487, 0.4634, 0.4781, 0.4928
          ],
          cmt: [
            0.1880, 0.2034, 0.2188, 0.2342, 0.2496,
            0.2650, 0.2804, 0.2958, 0.3112, 0.3266,
            0.3420, 0.3574, 0.3728, 0.3882, 0.4036,
            0.4190, 0.4344, 0.4498, 0.4652, 0.4806,
            0.4960, 0.5114, 0.5268, 0.5422, 0.5576
          ]
        },
      },
      {
        key: "pbox", label: "Parts Box (score)", desc: "Aggregate part bounding box quality (normalized). Higher means more precise localizations under occlusion.",
        pair: {
          baseline: [
            0.0750, 0.0914, 0.1078, 0.1242, 0.1406,
            0.1570, 0.1734, 0.1898, 0.2062, 0.2226,
            0.2390, 0.2554, 0.2718, 0.2882, 0.3046,
            0.3210, 0.3374, 0.3538, 0.3702, 0.3866,
            0.4030, 0.4194, 0.4358, 0.4522, 0.4686
          ],
          cmt: [
            0.1230, 0.1408, 0.1587, 0.1765, 0.1944,
            0.2122, 0.2301, 0.2479, 0.2658, 0.2836,
            0.3015, 0.3193, 0.3372, 0.3550, 0.3729,
            0.3907, 0.4086, 0.4264, 0.4443, 0.4621,
            0.4800, 0.4978, 0.5157, 0.5335, 0.5514
          ]
        },
      },
    ],
    analysis: {
      title: "Analysis of the visualizations",
      subtitle: "Multi-object interference and CMT benefits.",
      paragraphs: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat, massa sit amet hendrerit euismod, nibh dolor pharetra magna, a hendrerit nunc augue non est. Curabitur semper urna augue, quis aliquet lacus rutrum vitae.",
        "Suspendisse potenti. Cras ac tincidunt nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin id nisi sit amet augue interdum consectetur. Phasellus id nisi sit amet massa iaculis elementum.",
        "Duis vulputate magna sit amet purus rutrum, non tempor arcu eleifend. In hendrerit lectus leo, at vulputate mi porta eget. Vivamus et consequat augue, sit amet feugiat arcu. Maecenas vehicula, magna in lacinia iaculis, urna lorem dictum mi, vel pellentesque sem ante id mi."
      ],
    },
  },
  {
    key: "phase-6",
    nav: "Phase 6",
    title: "PHASE 6 — Highway (Dense, Multi-Lane)",
    intro:
      "Phase 6 finalizes tuning for dense, high-speed traffic and evaluates occlusion-heavy, multi-lane scenarios for deployment readiness.",
    images: [IMG("phase-6", 1), IMG("phase-6", 2), IMG("phase-6", 3), IMG("phase-6", 4), IMG("phase-6", 5), IMG("phase-6", 6)],
    metrics: [
      {
        key: "type", label: "Type (score)", desc: "Classification score for coarse vehicle type (e.g., Car, SUV, Jeepney). Higher is better; reflects normalized accuracy/F1.",
        pair: {
          baseline: [
            0.1200, 0.1340, 0.1480, 0.1620, 0.1760,
            0.1900, 0.2040, 0.2180, 0.2320, 0.2460,
            0.2600, 0.2740, 0.2880, 0.3020, 0.3160,
            0.3300, 0.3440, 0.3580, 0.3720, 0.3860,
            0.4000, 0.4140, 0.4280, 0.4420, 0.4560
          ],
          cmt: [
            0.1550, 0.1703, 0.1856, 0.2009, 0.2162,
            0.2315, 0.2468, 0.2621, 0.2774, 0.2927,
            0.3080, 0.3233, 0.3386, 0.3539, 0.3692,
            0.3845, 0.3998, 0.4151, 0.4304, 0.4457,
            0.4610, 0.4763, 0.4916, 0.5069, 0.5222
          ]
        },
      },
      {
        key: "make", label: "Make (score)", desc: "Classification score for manufacturer (Make). Higher means better recognition under varying views.",
        pair: {
          baseline: [
            0.0850, 0.0995, 0.1140, 0.1285, 0.1430,
            0.1575, 0.1720, 0.1865, 0.2010, 0.2155,
            0.2300, 0.2445, 0.2590, 0.2735, 0.2880,
            0.3025, 0.3170, 0.3315, 0.3460, 0.3605,
            0.3750, 0.3895, 0.4040, 0.4185, 0.4330
          ],
          cmt: [
            0.1200, 0.1351, 0.1502, 0.1653, 0.1804,
            0.1955, 0.2106, 0.2257, 0.2408, 0.2559,
            0.2710, 0.2861, 0.3012, 0.3163, 0.3314,
            0.3465, 0.3616, 0.3767, 0.3918, 0.4069,
            0.4220, 0.4371, 0.4522, 0.4673, 0.4824
          ]
        },
      },
      {
        key: "model", label: "Model (score)", desc: "Fine-grained model identification score. Higher indicates better discriminability between close siblings.",
        pair: {
          baseline: [
            0.1400, 0.1540, 0.1680, 0.1820, 0.1960,
            0.2100, 0.2240, 0.2380, 0.2520, 0.2660,
            0.2800, 0.2940, 0.3080, 0.3220, 0.3360,
            0.3500, 0.3640, 0.3780, 0.3920, 0.4060,
            0.4200, 0.4340, 0.4480, 0.4620, 0.4760
          ],
          cmt: [
            0.1750, 0.1907, 0.2064, 0.2221, 0.2378,
            0.2535, 0.2692, 0.2849, 0.3006, 0.3163,
            0.3320, 0.3477, 0.3634, 0.3791, 0.3948,
            0.4105, 0.4262, 0.4419, 0.4576, 0.4733,
            0.4890, 0.5047, 0.5204, 0.5361, 0.5518
          ]
        },
      },
      {
        key: "vbox", label: "Vehicle Box (score)", desc: "Regression quality for the whole-vehicle bounding box (normalized IoU/quality proxy). Higher is better.",
        pair: {
          baseline: [
            0.1500, 0.1630, 0.1760, 0.1890, 0.2020,
            0.2150, 0.2280, 0.2410, 0.2540, 0.2670,
            0.2800, 0.2930, 0.3060, 0.3190, 0.3320,
            0.3450, 0.3580, 0.3710, 0.3840, 0.3970,
            0.4100, 0.4230, 0.4360, 0.4490, 0.4620
          ],
          cmt: [
            0.1850, 0.1996, 0.2142, 0.2288, 0.2434,
            0.2580, 0.2726, 0.2872, 0.3018, 0.3164,
            0.3310, 0.3456, 0.3602, 0.3748, 0.3894,
            0.4040, 0.4186, 0.4332, 0.4478, 0.4624,
            0.4770, 0.4916, 0.5062, 0.5208, 0.5354
          ]
        },
      },
      {
        key: "pbox", label: "Parts Box (score)", desc: "Aggregate part bounding box quality (normalized). Higher means more precise localizations under occlusion.",
        pair: {
          baseline: [
            0.0950, 0.1090, 0.1230, 0.1370, 0.1510,
            0.1650, 0.1790, 0.1930, 0.2070, 0.2210,
            0.2350, 0.2490, 0.2630, 0.2770, 0.2910,
            0.3050, 0.3190, 0.3330, 0.3470, 0.3610,
            0.3750, 0.3890, 0.4030, 0.4170, 0.4310
          ],
          cmt: [
            0.1430, 0.1590, 0.1750, 0.1910, 0.2070,
            0.2230, 0.2390, 0.2550, 0.2710, 0.2870,
            0.3030, 0.3190, 0.3350, 0.3510, 0.3670,
            0.3830, 0.3990, 0.4150, 0.4310, 0.4470,
            0.4630, 0.4790, 0.4950, 0.5110, 0.5270
          ]
        },
      },
    ],
    analysis: {
      title: "Analysis of the visualizations",
      subtitle: "Stability at scale and convergence characteristics.",
      paragraphs: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat, massa sit amet hendrerit euismod, nibh dolor pharetra magna, a hendrerit nunc augue non est. Curabitur semper urna augue, quis aliquet lacus rutrum vitae.",
        "Suspendisse potenti. Cras ac tincidunt nibh. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin id nisi sit amet augue interdum consectetur. Phasellus id nisi sit amet massa iaculis elementum.",
        "Duis vulputate magna sit amet purus rutrum, non tempor arcu eleifend. In hendrerit lectus leo, at vulputate mi porta eget. Vivamus et consequat augue, sit amet feugiat arcu. Maecenas vehicula, magna in lacinia iaculis, urna lorem dictum mi, vel pellentesque sem ante id mi."
      ],
    },
  },
];

/* Intro page content (lives here so everything is in one JS file) */
export const INTRO = {
  heroTitle: "CVITX Training Logs",
  heroSubtitle:
    "A phase-by-phase view of Baseline vs Compositional Masking Training (CMT) across coarse type, make, model, and bounding-box quality.",
  aboutTitle: "What is CVITX?",
  aboutBody:
    "CVITX is a part-aware MobileViT training strategy designed for fine-grained vehicle recognition under occlusion. It combines Baseline supervised learning with Compositional Masking Training to reduce reliance on highly salient regions and improve robustness.",
  baselineTitle: "Baseline vs CMT",
  baselineBody:
    "Baseline refers to standard supervised training using full images. CMT augments training by masking parts or regions—progressively and contextually—to encourage the network to learn complementary cues. In the charts, Baseline (left, blue) covers steps 01–25 and CMT (right, orange) continues with steps 01–25.",
  ctaTitle: "Browse phases",
  ctaBody:
    "Select any phase below to see sample frames and five charts: Type, Make, Model, Vehicle Box, and Parts Box scores.",
};
