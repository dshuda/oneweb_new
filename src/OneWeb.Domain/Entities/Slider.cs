using System;

namespace OneWeb.Domain.Entities;

public class Slider : BaseEntity
{
    public string? Title { get; set; }
    public string? SubTitle { get; set; }
    public string? Image { get; set; }
    public int? PhotoId { get; set; }
    public string? Link { get; set; }
    public int Position { get; set; } = 0;
    public bool Status { get; set; } = true;
}
