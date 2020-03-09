const findBestMatches = (matches, ratio) => {
    let bestMatches = new cv.DMatchVector();
    for (let i = 0; i < matches.size(); i++) {
        let m = matches.get(i);
        if (m.distance < matches.size()*ratio) {
            bestMatches.push_back(m);
        }
    }
    return bestMatches;
};

export { findBestMatches };
