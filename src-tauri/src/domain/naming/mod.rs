use crate::error::{AppError, AppResult};
use unicode_normalization::{char::is_combining_mark, UnicodeNormalization};

pub fn validate_widths(widths: &[usize]) -> AppResult<()> {
    if widths.is_empty() || widths.len() > 8 || widths.iter().any(|n| !(1..=6).contains(n)) {
        return Err(AppError::new(
            "INVALID_WIDTHS",
            "1..8 levels, each width 1..6",
        ));
    }
    Ok(())
}

pub fn normalize_name(input: &str) -> AppResult<String> {
    let mut result = String::new();
    for ch in input.trim().nfd().filter(|c| !is_combining_mark(*c)) {
        let ch = match ch {
            'đ' => 'd',
            'Đ' => 'D',
            other => other,
        };
        if ch.is_alphanumeric() || ch == '-' {
            result.push(ch);
        } else if !result.is_empty() && !result.ends_with('_') {
            result.push('_');
        }
    }
    let result = result.trim_matches('_').to_string();
    let upper = result.to_uppercase();
    let reserved = matches!(upper.as_str(), "CON" | "PRN" | "AUX" | "NUL")
        || (upper.len() == 4
            && (upper.starts_with("COM") || upper.starts_with("LPT"))
            && matches!(upper.as_bytes()[3], b'1'..=b'9'));
    if result.is_empty() || reserved || result.len() > 160 {
        return Err(AppError::new(
            "INVALID_NAME",
            "Name is empty, reserved or too long",
        ));
    }
    Ok(result)
}

pub fn width_at(widths: &[usize], level: usize) -> usize {
    *widths
        .get(level)
        .unwrap_or_else(|| widths.last().expect("validated widths"))
}

pub fn code_parts(name: &str) -> Option<(Vec<u64>, String)> {
    let (prefix, description) = name.split_once(' ')?;
    if description.is_empty() {
        return None;
    }
    let segments: Option<Vec<_>> = prefix
        .split('.')
        .map(|p| {
            if p.is_empty() || !p.bytes().all(|c| c.is_ascii_digit()) {
                return None;
            }
            p.parse::<u64>().ok().filter(|n| *n > 0)
        })
        .collect();
    Some((segments?, description.into()))
}

pub fn render_code(parts: &[u64], widths: &[usize]) -> AppResult<String> {
    validate_widths(widths)?;
    let mut segments = Vec::new();
    for (level, number) in parts.iter().enumerate() {
        let width = width_at(widths, level);
        if *number == 0 || *number >= 10_u64.pow(width as u32) {
            return Err(AppError::new(
                "CODE_OVERFLOW",
                "Increase the configured code width",
            ));
        }
        segments.push(format!("{number:0width$}"));
    }
    Ok(segments.join("."))
}

pub fn code_key(parts: &[u64]) -> String {
    parts
        .iter()
        .map(u64::to_string)
        .collect::<Vec<_>>()
        .join("/")
}

pub fn description_of(name: &str, is_dir: bool) -> (String, Option<String>) {
    let description = code_parts(name)
        .map(|(_, n)| n)
        .unwrap_or_else(|| name.into());
    if !is_dir {
        if let Some((stem, extension)) = description.rsplit_once('.') {
            if !stem.is_empty() && !extension.is_empty() {
                return (stem.into(), Some(extension.into()));
            }
        }
    }
    (description, None)
}

pub fn filename(code: &str, description: &str, extension: Option<&str>) -> AppResult<String> {
    let stem = normalize_name(description)?;
    Ok(match extension {
        Some(ext) => format!("{code} {stem}.{ext}"),
        None => format!("{code} {stem}"),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn vietnamese_and_combining_characters() {
        assert_eq!(
            normalize_name("  Hóa đơn / Đặng tháng 10  ").unwrap(),
            "Hoa_don_Dang_thang_10"
        );
        assert_eq!(normalize_name("Ho\u{301}a đo\u{31b}n").unwrap(), "Hoa_don");
        assert!(normalize_name("CON").is_err());
        assert!(normalize_name("../").is_err());
    }
    #[test]
    fn codes_have_unambiguous_numeric_identity() {
        assert_eq!(
            code_key(&code_parts("03.01.001 Test.pdf").unwrap().0),
            "3/1/1"
        );
        assert_eq!(render_code(&[3, 1, 1], &[2, 2, 3]).unwrap(), "03.01.001");
        assert_eq!(render_code(&[3, 1, 1], &[3, 3, 4]).unwrap(), "003.001.0001");
        assert!(render_code(&[100], &[2]).is_err());
    }
    #[test]
    fn preserve_extensions_and_extensionless_files() {
        assert_eq!(
            description_of("03.01 Invoice.PDF", false),
            ("Invoice".into(), Some("PDF".into()))
        );
        assert_eq!(description_of("LICENSE", false), ("LICENSE".into(), None));
        assert_eq!(description_of(".env", false), (".env".into(), None));
        assert_eq!(
            filename("01", "Hóa đơn", Some("pdf")).unwrap(),
            "01 Hoa_don.pdf"
        );
    }
}
