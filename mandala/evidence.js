/* Evidence presentation for the local prototype. No hypotheses are upgraded here. */
(function (global) {
  'use strict';

  const sourceLabels = {
    'tsadra-ga017': 'Tsadra GA-017 · concise activity',
    'tsadra-ga022': 'Tsadra GA-022 · torma empowerment',
    'tsadra-ga019': 'Tsadra GA-019 · concise self-generation',
    'bardoos-dharmata': 'BardoOS · Dharmatā introduction',
    'bardoos-wrathful': 'BardoOS · wrathful elucidation',
    'bardoos-manifest': 'BardoOS · deity catalog',
    'lh-karling-empowerment': 'Lotsawa House · empowerment translation',
    'tsadra-image': 'Tsadra · source image',
    'har-glossary': 'Himalayan Art · technical glossary',
    'dorje-ch11': 'The Bardo Thödröl (Dorje translation) · chapter 11',
    'dorje-appendix-two': 'Supplied Bardo Thödröl (Dorje translation) · Appendix Two',
    'pema-kunzang-2-1-1': 'Pema Lingpa · Kunzang Zhitro §2.1.1 (comparison)',
  };
  const unique = values => [...new Set(values.filter(Boolean))];
  const sentence = value => value ? value.trim().replace(/[.;]?$/, '.') : '';
  const words = value => (value || '').replaceAll('-', ' ');
  const cap = value => value ? value[0].toUpperCase() + value.slice(1) : '';

  function collectSourceIds(value, result = []) {
    if (!value || typeof value !== 'object') return result;
    if (typeof value.sourceId === 'string') result.push(value.sourceId);
    if (Array.isArray(value.sourceIds)) result.push(...value.sourceIds);
    for (const child of Object.values(value)) {
      if (child && typeof child === 'object') collectSourceIds(child, result);
    }
    return result;
  }

  function statusLabel(target) {
    if (target.kind !== 'single-observation') return 'Possible group · positions unresolved';
    if (!target.candidateDeityIds.length) return 'Unidentified';
    if (target.reviewFlags?.includes('major-color-conflict')) return 'Possible identity · color conflict';
    return target.evidenceStatus === 'provisional' ? 'Possible identity' : 'Identification unresolved';
  }

  function observationLabel(observation) {
    const detail = observation.positionWithinGateApproach || observation.positionWithinPetal;
    return [words(observation.screenPosition), words(detail)].filter(Boolean).join(' · ');
  }

  function encodingDescription(encoding) {
    const descriptions = {
      'two-peaceful-individuals': {
        label: 'Two individual peaceful gatekeepers',
        description: 'One peaceful-assembly partner per circle. Which partner is inner or outer is unknown; this reading leaves the additional animal-headed gatewoman unlocated.',
      },
      'peaceful-couple-and-animal-gatewoman': {
        label: 'A peaceful couple and an animal-headed gatewoman',
        description: 'One circle may represent the peaceful couple, the other the wrathful gatewoman. Shared seats and their inner/outer order are unconfirmed.',
      },
      'six-peaceful-individuals': {
        label: 'Six individual peaceful figures',
        description: 'The principal Buddha and consort may occupy separate middle positions, with four attendants. No individual order has been established.',
      },
      'two-couples-plus-four-attendants': {
        label: 'Two couples and four attendants',
        description: 'The middle positions may represent one peaceful couple and one Heruka couple. Shared seats and their order are unconfirmed.',
      },
    };
    return descriptions[encoding.id] || {
      label: cap(words(encoding.id)),
      description: sentence(encoding.middlePositions || encoding.order || 'Interpretation unresolved'),
    };
  }

  function buildPanel(target, bundle) {
    if (!target || !bundle?.scene || !bundle?.mapping) throw new Error('A target and research bundle are required.');
    const records = target.observationIds.map(id => bundle.mapping.assignments.find(a => a.markerId === id)).filter(Boolean);
    const observations = records.map(a => ({
      id: a.markerId,
      color: a.observation.visibleColor,
      position: observationLabel(a.observation),
    }));
    const hypotheses = target.hypotheses || [];
    const evidenceGroup = bundle.mapping.groupHypotheses.find(g => g.id === target.evidenceGroupId);
    const notes = [];
    let groups = [];
    let alternatives = [];
    let summary;
    let title = target.label;

    if (target.kind === 'gate-assembly') {
      title = `${cap(target.candidateRitualDirection)} gate`;
      summary = 'Two observed circles form one selectable gate group. The texts suggest three candidate figures; neither circle has a settled individual identity.';
      groups = [
        { label: 'Possible peaceful pair', ids: target.candidateRoles.peacefulPair },
        { label: 'Possible additional wrathful gatewoman', ids: target.candidateRoles.animalHeadedGatewoman },
      ];
      alternatives = (target.encodingAlternatives || []).map(encodingDescription);
      const pair = evidenceGroup?.peacefulPairCrosswalk;
      notes.push(pair?.femaleDirectionExplicit
        ? 'The supplied appendix explicitly names the peaceful partners and their directions. Their pairing is supported in that text; which painted circle represents which figure remains unknown. Both dots have the same directional color.'
        : 'The peaceful female partner’s directional pairing is inferred from implements and ordering. Both dots have the same directional color, so color does not decide their occupants.');
      notes.push(...(target.sourceVariants || []).map(note => note.replace('Do not replace app identity or silently change source reading.', 'The painting does not establish which source variant applies.')));
      if (target.candidateRitualDirection === 'east') {
        // Retain the source variant even if a future crosswalk omits its prose note.
        if (!notes.some(n => /horse-headed.*tiger-headed/i.test(n))) {
          notes.push('GA-017 reads horse-headed (rta gdong); the app reads tiger-headed (stag gdong). The painted circles do not resolve this source difference.');
        }
      }
    } else if (target.kind === 'petal-assembly') {
      title = `${cap(target.candidateRitualDirection)} petal · ${target.candidateFamily} family`;
      const isEast = target.ambiguityClusterIds?.includes('bottom-petal-axial-strip');
      summary = isEast
        ? 'Four circles and one ambiguous dark/light strip are visible. This is a possible family assembly; no individual person is bound to a painted position.'
        : 'Six circles form a possible family assembly. Their individual occupants and whether some circles represent couples remain unresolved.';
      groups = [
        { label: 'Possible peaceful family', ids: target.candidateRoles.peacefulFamily },
        { label: 'Possible additional Heruka couple', ids: target.candidateRoles.possibleAdditionalWrathfulCouple },
      ];
      alternatives = (target.encodingAlternatives || []).map(encodingDescription);
      if (isEast) notes.push('The three recorded dark/light/dark features belong to one ambiguous strip. They are not three confirmed circles. The strip could represent one to three markers; both six-position readings are conditional here.');
      notes.push('Textual right/left/front/rear descriptions have not been translated into an exact screen arrangement. Choosing this group does not identify each of its circles.');
      if (target.candidateRitualDirection === 'north') notes.push('The northern rear offering figure is ni rti in GA-017, Nartī in the app text, and Naivedyā in the catalog. This is a documented name/role crosswalk.');
    } else {
      groups = target.candidateDeityIds.length ? [{
        label: target.candidateDeityIds.length > 1 ? 'Candidate identities across alternatives' : 'Possible identity',
        ids: target.candidateDeityIds,
      }] : [];
      if (!target.candidateDeityIds.length) {
        summary = 'This red central circle is visible, but the inspected sources do not support a specific identity. It remains unassigned.';
        notes.push('A deity’s red side face is not evidence of a red body or red seat marker. No identity is assigned by elimination.');
      } else if (target.group === 'six-realm-sages') {
        summary = 'The six realm sages are a possible reading of this annulus. This position is compared with the source directions and colors; the placement remains provisional.';
        notes.push('The source locates four sages in intermediate directions and two above/below. How those heights become positions in this flat image is unknown.');
      } else if (target.id === 'target-marker-002') {
        summary = 'Buddhakrodheśvarī is a new, tentative candidate because the supplied appendix describes her as red-brown. The coral-red circle remains unidentified: neither its occupant nor its individual/couple meaning is established.';
      } else if (target.group === 'central') {
        summary = 'The central texts describe figures and couples, but they do not explain how those figures are encoded by these four painted circles.';
      } else {
        summary = 'This candidate follows the working orientation and ring identification. The painting has no located key that verifies this individual dot.';
      }
      if (target.colorAssessment?.explanation) notes.push(target.colorAssessment.explanation);
      for (const h of hypotheses) {
        alternatives.push({
          label: h.candidateLabel,
          description: [sentence(h.basis), sentence(h.colorComparison), sentence(h.representation || h.memberSemantics)].filter(Boolean).join(' '),
        });
      }
      for (const record of records) {
        if (record.inference) notes.push(record.inference);
        const textColor = record.tsadraEvidence?.colorGloss;
        const appColor = record.textualEvidence?.colorEnglish;
        if (textColor || appColor) notes.push(`Text comparison: ${[textColor && `GA-017 ${textColor}`, appColor && `app ${appColor}`].filter(Boolean).join('; ')}. Observed paint: ${record.observation.visibleColor}.`);
      }
    }
    const comparativeGroup = evidenceGroup || bundle.mapping.groupHypotheses.find(g => g.id === target.group);
    for (const evidence of [...records, comparativeGroup].filter(Boolean).flatMap(item => item.supplementalEvidence || [])) {
      notes.push(`${evidence.claim} (${sourceLabels[evidence.sourceId] || evidence.sourceId}; ${evidence.locator}.)`);
    }
    const unmappedCandidates = unique(hypotheses.flatMap(h => h.missingAppIdentities || []));
    if (unmappedCandidates.length) notes.push('Some research candidates have no matching app identity or artwork. They are retained separately rather than merged into an existing deity.');
    notes.push('Candidate lists are alternatives or possible group members; they do not assert that every listed figure occupies this location.');

    let sourceIds = unique(collectSourceIds([target, ...records, comparativeGroup]));
    if (target.group === 'central') sourceIds = unique([...sourceIds, ...collectSourceIds(bundle.mapping.centralTextEvidence)]);
    const sources = sourceIds.map(id => bundle.mapping.sources.find(s => s.id === id)).filter(Boolean)
      .map(source => ({ label: sourceLabels[source.id] || source.id, url: source.url }));

    return { title, statusLabel: statusLabel(target), summary, groups, notes: unique(notes), alternatives, sources, observations, unmappedCandidates };
  }

  global.MandalaEvidence = Object.freeze({ buildPanel, statusLabel });
}(typeof window !== 'undefined' ? window : globalThis));
